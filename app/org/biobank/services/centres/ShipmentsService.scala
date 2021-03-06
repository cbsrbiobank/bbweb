package org.biobank.services.centres

import akka.actor._
import akka.pattern.ask
import com.google.inject.ImplementedBy
import java.time.format.DateTimeFormatter
import javax.inject.{Inject, Named}
import org.biobank.domain.LocationId
import org.biobank.domain.centres._
import org.biobank.domain.access.PermissionId
import org.biobank.domain.participants._
import org.biobank.domain.studies.CollectionEventTypeRepository
import org.biobank.domain.users.UserId
import org.biobank.dto.{ShipmentDto, ShipmentSpecimenDto, SpecimenDto}
import org.biobank.infrastructure.AscendingOrder
import org.biobank.infrastructure.commands.ShipmentCommands._
import org.biobank.infrastructure.commands.ShipmentSpecimenCommands._
import org.biobank.infrastructure.events.ShipmentEvents._
import org.biobank.infrastructure.events.ShipmentSpecimenEvents._
import org.biobank.services.participants.SpecimensService
import org.biobank.services._
import org.biobank.services.access.AccessService
import org.slf4j.{Logger, LoggerFactory}
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent._
import scalaz.Scalaz._
import scalaz.Validation.FlatMap._
import scalaz._

@ImplementedBy(classOf[ShipmentsServiceImpl])
trait ShipmentsService extends BbwebService {

  def getShipment(requestUserId: UserId, id: ShipmentId): ServiceValidation[ShipmentDto]

  /**
   * Returns a set of shipments to or from a Centre. The shipments can be filtered and or sorted using
   * expressions.
   *
   * @param centreId the ID of the centre the shipments belong to.
   *
   * @param filter the string representation of the filter expression to use to filter the shipments.
   *
   * @param sort the string representation of the sort expression to use when sorting the shipments.
   */
  def getShipments(requestUserId: UserId, pagedQuery: PagedQuery):
      Future[ServiceValidation[PagedResults[ShipmentDto]]]

  /**
   * Returns a set of shipment specimens. The entities can be filtered and or sorted using expressions.
   *
   * @param shipmentId the ID of the shipment the shipment specimens belong to.
   *
   * @param filter the string representation of the filter expression to use to filter the shipment specimens
   *               in the shipment.
   */
  def getShipmentSpecimens(requestUserId: UserId, shipmentId: ShipmentId, pagedQuery: PagedQuery)
      : Future[ServiceValidation[PagedResults[ShipmentSpecimenDto]]]

  def shipmentCanAddSpecimen(requestUserId: UserId, shipmentId: ShipmentId, shipmentSpecimenId: String)
      : ServiceValidation[SpecimenDto]

  def getShipmentSpecimen(requestUserId:      UserId,
                          shipmentId:         ShipmentId,
                          shipmentSpecimenId: ShipmentSpecimenId)
      : ServiceValidation[ShipmentSpecimenDto]

  def processCommand(cmd: ShipmentCommand): Future[ServiceValidation[ShipmentDto]]

  def removeShipment(cmd: ShipmentRemoveCmd): Future[ServiceValidation[Boolean]]

  def processShipmentSpecimenCommand(cmd: ShipmentSpecimenCommand):
      Future[ServiceValidation[ShipmentDto]]

  def snapshotRequest(requestUserId: UserId): ServiceValidation[Unit]

}

/**
 * Handles all commands dealing with shipments, shipment specimens, and shipment containers.
 */
class ShipmentsServiceImpl @Inject() (@Named("shipmentsProcessor") val   processor: ActorRef,
                                      val accessService:                 AccessService,
                                      val centreRepository:              CentreRepository,
                                      val shipmentRepository:            ShipmentRepository,
                                      val shipmentSpecimenRepository:    ShipmentSpecimenRepository,
                                      val specimenRepository:            SpecimenRepository,
                                      val ceventSpecimenRepository:      CeventSpecimenRepository,
                                      val collectionEventRepository:     CollectionEventRepository,
                                      val collectionEventTypeRepository: CollectionEventTypeRepository,
                                      val specimensService:              SpecimensService,
                                      val shipmentFilter:                ShipmentFilter)
    extends ShipmentsService
    with AccessChecksSerivce
    with CentreServicePermissionChecks
    with ShipmentConstraints {

  import org.biobank.CommonValidations._

  val log: Logger = LoggerFactory.getLogger(this.getClass)

  def getShipment(requestUserId: UserId, id: ShipmentId): ServiceValidation[ShipmentDto] = {
    whenShipmentPermitted(requestUserId, id) { shipment =>
      shipmentToDto(shipment)
    }
  }

  /**
   * Sorting should be done by controller since the DTO has additional fields to sort by.
   *
   */
  def getShipments(requestUserId: UserId, query: PagedQuery)
      : Future[ServiceValidation[PagedResults[ShipmentDto]]] = {
    Future {
      withPermittedShippingCentres(requestUserId) { centres =>
        val shipments = centres
          .map { centre => shipmentRepository.withCentre(centre.id) }
          .toList.sequenceU.toSet

        val sortStr = if (query.sort.expression.isEmpty) new SortString("courierName")
                      else query.sort

        for {
          filtered <- shipmentFilter.filterShipments(shipments, query.filter)
          validPage <- query.validPage(filtered.size)
          sortExpressions <- {
            QuerySortParser(sortStr)
              .toSuccessNel(ServiceError(s"could not parse sort expression: ${query.sort}"))
          }
          sortFunc <- {
            ShipmentDto.sort2Compare.get(sortExpressions(0).name).
              toSuccessNel(ServiceError(s"invalid sort field: ${sortExpressions(0).name}"))
          }
          shipmentDtos <- filtered.map(shipmentToDto).toList.sequenceU
          result <- {
            val results = shipmentDtos.sortWith(sortFunc)
            val sortedResults = if (sortExpressions(0).order == AscendingOrder) results
                                else results.reverse
            PagedResults.create(sortedResults, query.page, query.limit)
          }
        } yield result
      }
    }
  }

  def shipmentCanAddSpecimen(requestUserId: UserId, shipmentId: ShipmentId, specimenInventoryId: String)
      : ServiceValidation[SpecimenDto] = {
    whenShipmentPermitted(requestUserId, shipmentId) { shipment =>
      for {
        specimen     <- specimenRepository.getByInventoryId(specimenInventoryId)
        sameLocation <- {
          if (shipment.fromLocationId == specimen.locationId) {
            specimen.successNel[ServiceError]
          } else {
            ServiceError(s"specimen not at shipment's from location").failureNel[Specimen]
          }
        }
        canBeAdded <- specimensNotPresentInShipment(specimen)
        specimen  <- specimensService.get(requestUserId, specimen.id)
      } yield specimen
    }
  }

  def getShipmentSpecimen(requestUserId: UserId,
                          shipmentId: ShipmentId,
                          shipmentSpecimenId: ShipmentSpecimenId)
      : ServiceValidation[ShipmentSpecimenDto] = {
    whenShipmentPermitted(requestUserId, shipmentId) { shipment =>
      shipmentSpecimenRepository.getByKey(shipmentSpecimenId).flatMap { specimen =>
        shipmentSpecimenToDto(requestUserId, specimen)
      }
    }
  }

  /**
   * Sorting should be done by controller since the DTO has additional fields to sort by.
   *
   */
  def getShipmentSpecimens(requestUserId: UserId, shipmentId: ShipmentId, query: PagedQuery)
      : Future[ServiceValidation[PagedResults[ShipmentSpecimenDto]]] = {
    Future {
      whenShipmentPermitted(requestUserId, shipmentId) { shipment =>
        val shipmentSpecimens = shipmentSpecimenRepository.allForShipment(shipment.id)
        val sortStr = if (query.sort.expression.isEmpty) new SortString("state")
                      else query.sort

        for {
          filtered <- ShipmentSpecimenFilter.filterShipmentSpecimens(shipmentSpecimens, query.filter)
          validPage <- query.validPage(filtered.size)
          sortExpressions <- {
            QuerySortParser(sortStr)
              .toSuccessNel(ServiceError(s"could not parse sort expression: ${query.sort}"))
          }
          sortFunc <- {
            ShipmentSpecimenDto.sort2Compare.get(sortExpressions(0).name).
              toSuccessNel(ServiceError(s"invalid sort field: ${sortExpressions(0).name}"))
          }
          ssDtos <- {
            filtered.map(ss => shipmentSpecimenToDto(requestUserId, ss)).toList.sequenceU
          }
          results <- {
            val results = ssDtos.sortWith(sortFunc)
            val sortedResults = if (sortExpressions(0).order == AscendingOrder) results
                                else results.reverse
            PagedResults.create(sortedResults, query.page, query.limit)
          }
        } yield results
      }
    }
  }

  def processCommand(cmd: ShipmentCommand): Future[ServiceValidation[ShipmentDto]] = {
    val validCommand = cmd match {
        case c: ShipmentRemoveCmd =>
          ServiceError(s"invalid service call: $cmd, use removeShipment").failureNel[Shipment]
        case c => c.successNel[String]
      }

    validCommand.fold(
      err => Future.successful(err.failure[ShipmentDto]),
      _   => whenShipmentPermittedAsync(cmd) { () =>
        ask(processor, cmd).mapTo[ServiceValidation[ShipmentEvent]].map { validation =>
          for {
            event    <- validation
            shipment <- shipmentRepository.getByKey(ShipmentId(event.id))
            dto      <- shipmentToDto(shipment)
          } yield dto
        }
      }
    )
  }

  def removeShipment(cmd: ShipmentRemoveCmd): Future[ServiceValidation[Boolean]] = {
    whenShipmentPermittedAsync(cmd) { () =>
      ask(processor, cmd).mapTo[ServiceValidation[ShipmentEvent]].map { validation =>
        validation.map(_ => true)
      }
    }
  }

  def processShipmentSpecimenCommand(cmd: ShipmentSpecimenCommand)
      : Future[ServiceValidation[ShipmentDto]] = {
    whenShipmentPermittedAsync(cmd) { () =>
      ask(processor, cmd).mapTo[ServiceValidation[ShipmentSpecimenEvent]].map { validation =>
        for {
          event    <- validation
          shipment <- shipmentRepository.getByKey(ShipmentId(event.shipmentId))
          dto      <- shipmentToDto(shipment)
        } yield dto
      }
    }
  }

  //
  // Invokes function "block" if user that invoked this service has the permission and membership
  // to do so.
  //
  private def whenShipmentPermitted[T](requestUserId: UserId, shipmentId: ShipmentId)
                                   (block: Shipment => ServiceValidation[T]): ServiceValidation[T] = {
    for {
      shipment   <- shipmentRepository.getByKey(shipmentId)
      fromCentre <- centreRepository.getByLocationId(shipment.fromLocationId)
      toCentre   <- centreRepository.getByLocationId(shipment.toLocationId)
      isMember   <- accessService.isMember(requestUserId, None, Some(fromCentre.id)).fold(
        err      => err.failure[Boolean],
        isMember => if (isMember) true.successNel[String]
                    else Unauthorized.failureNel[Boolean]
      )
      result     <- whenPermittedAndIsMember(requestUserId,
                                             PermissionId.ShipmentRead,
                                             None,
                                             Some(toCentre.id))(() => block(shipment))
    } yield result
  }

  case class ShipmentCentreIds(fromId: CentreId, toId: CentreId)

  private def validCentresIds(shipmentId: ShipmentId): ServiceValidation[ShipmentCentreIds] = {
    for {
      shipment   <- shipmentRepository.getByKey(shipmentId)
      fromCentre <- centreRepository.getByKey(shipment.fromCentreId)
      toCentre   <- centreRepository.getByKey(shipment.toCentreId)
    } yield ShipmentCentreIds(fromCentre.id, toCentre.id)
  }


  private def isMemberOfCentres(userId: UserId, validCentreIds: ServiceValidation[ShipmentCentreIds]) = {
    for {
      centreIds  <- validCentreIds
      fromMember <- accessService.isMember(userId, None, Some(centreIds.fromId)).fold(
        err      => err.failure[Boolean],
        isMember => if (isMember) true.successNel[String]
                    else Unauthorized.failureNel[Boolean]
      )
      toMember   <- accessService.isMember(userId, None, Some(centreIds.toId)).fold(
        err      => err.failure[Boolean],
        isMember => if (isMember) true.successNel[String]
                    else Unauthorized.failureNel[Boolean]
      )
    } yield toMember
  }

  //
  // Invokes function "block" if user that issued the command has the permission and membership
  // to do so.
  //
  @SuppressWarnings(Array("org.wartremover.warts.Overloading"))
  private def whenShipmentPermittedAsync[T](cmd: ShipmentCommand)
                                           (block: () => Future[ServiceValidation[T]])
      : Future[ServiceValidation[T]] = {

    val sessionUserId = UserId(cmd.sessionUserId)
    val validCentreIds = cmd match {
        case c: ShipmentModifyCommand => validCentresIds(ShipmentId(c.id))
        case c: AddShipmentCmd =>
          for {
            fromCentre <- centreRepository.getByLocationId(LocationId(c.fromLocationId))
            toCentre   <- centreRepository.getByLocationId(LocationId(c.toLocationId))
          } yield ShipmentCentreIds(fromCentre.id, toCentre.id)
      }

    val permission = cmd match {
        case c: AddShipmentCmd    => PermissionId.ShipmentCreate
        case c: ShipmentRemoveCmd => PermissionId.ShipmentDelete
        case c                    => PermissionId.ShipmentUpdate
      }

    isMemberOfCentres(sessionUserId, validCentreIds).fold(
      err    => Future.successful(err.failure[T]),
      member => whenPermittedAsync(sessionUserId, permission)(block)
    )
  }

  //
  // Invokes function "block" if user that issued the command has the permission and membership
  // to do so.
  //
  private def whenShipmentPermittedAsync[T](cmd: ShipmentSpecimenCommand)
                                           (block: () => Future[ServiceValidation[T]])
      : Future[ServiceValidation[T]] = {

    val sessionUserId = UserId(cmd.sessionUserId)
    val shipmentId = ShipmentId(cmd.shipmentId)
    isMemberOfCentres(sessionUserId, validCentresIds(shipmentId)).fold(
      err    => Future.successful(err.failure[T]),
      member => whenPermittedAsync(sessionUserId, PermissionId.ShipmentUpdate)(block)
    )
  }

  private def shipmentToDto(shipment: Shipment): ServiceValidation[ShipmentDto] = {
    for {
      fromCentre       <- centreRepository.getByLocationId(shipment.fromLocationId)
      fromLocationName <- fromCentre.locationName(shipment.fromLocationId)
      toCentre         <- centreRepository.getByLocationId(shipment.toLocationId)
      toLocationName   <- toCentre.locationName(shipment.toLocationId)
    } yield {
      val fromLocationInfo = CentreLocationInfo(fromCentre.id.id,
                                                shipment.fromLocationId.id,
                                                fromLocationName)
      val toLocationInfo = CentreLocationInfo(toCentre.id.id,
                                              shipment.toLocationId.id,
                                              toLocationName)
      val specimens = shipmentSpecimenRepository.allForShipment(shipment.id)

      // TODO: update with container count when ready
      ShipmentDto.create(shipment, fromLocationInfo, toLocationInfo, specimens.size, 0)
    }
  }

  private def shipmentSpecimenToDto(requestUserId: UserId, shipmentSpecimen: ShipmentSpecimen)
      : ServiceValidation[ShipmentSpecimenDto] = {
    specimensService.get(requestUserId, shipmentSpecimen.specimenId).map { specimen =>
      ShipmentSpecimenDto(
        id                  = shipmentSpecimen.id.id,
        version             = shipmentSpecimen.version,
        timeAdded           = shipmentSpecimen.timeAdded.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME),
        timeModified        = shipmentSpecimen.timeModified.map(_.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)),
        shipmentId          = shipmentSpecimen.shipmentId.id,
        shipmentContainerId = shipmentSpecimen.shipmentContainerId.map(id => id.id),
        state               = shipmentSpecimen.state.toString,
        specimen            = specimen)
    }
  }

}
