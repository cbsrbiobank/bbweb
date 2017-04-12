package org.biobank.service.participants

import akka.actor._
import akka.persistence.{RecoveryCompleted, SaveSnapshotSuccess, SaveSnapshotFailure, SnapshotOffer}
import javax.inject.{Inject, Singleton}
import org.biobank.domain.LocationId
import org.biobank.domain.participants._
import org.biobank.domain.processing.ProcessingEventInputSpecimenRepository
import org.biobank.domain.study.{CollectionEventType, CollectionEventTypeRepository}
import org.biobank.infrastructure.command.SpecimenCommands._
import org.biobank.infrastructure.event.SpecimenEvents._
import org.biobank.service.{Processor, ServiceError, ServiceValidation, SnapshotWriter}
import org.joda.time.DateTime
import org.joda.time.format.ISODateTimeFormat
import play.api.libs.json._
import scalaz.Scalaz._
import scalaz.Validation.FlatMap._

object SpecimensProcessor {
  import org.biobank.CommonValidations._

  def props: Props = Props[SpecimensProcessor]

  final case class SnapshotState(specimens: Set[Specimen])

  implicit val snapshotStateFormat: Format[SnapshotState] = Json.format[SnapshotState]

  def specimenSpecNotFound(id: String): IdNotFound = IdNotFound(s"collection specimen spec id: $id")

}

/**
 * Responsible for handing collection event commands to add, update and remove.
 */
@Singleton
class SpecimensProcessor @Inject() (
  val specimenRepository:                     SpecimenRepository,
  val collectionEventRepository:              CollectionEventRepository,
  val collectionEventTypeRepository:          CollectionEventTypeRepository,
  val ceventSpecimenRepository:               CeventSpecimenRepository,
  val processingEventInputSpecimenRepository: ProcessingEventInputSpecimenRepository,
  val snapshotWriter:                         SnapshotWriter)
  // FIXME add container repository when implemented
  //val containerRepository:       ContainerRepository)
    extends Processor {

  import SpecimensProcessor._
  import SpecimenEvent.EventType
  import org.biobank.infrastructure.event.EventUtils._
  import org.biobank.CommonValidations._

  override def persistenceId: String = "specimens-processor-id"

  /**
   * These are the events that are recovered during journal recovery. They cannot fail and must be
   * processed to recreate the current state of the aggregate.
   */
  @SuppressWarnings(Array("org.wartremover.warts.Any"))
  val receiveRecover: Receive = {
    case event: SpecimenEvent =>

      log.info(s"----------------------> $event")

      event.eventType match {
        case et: EventType.Added              => applyAddedEvent(event)
        case et: EventType.Moved              => applyMovedEvent(event)
        case et: EventType.PosisitionAssigned => applyPositionAssignedEvent(event)
        case et: EventType.AmountRemoved      => applyAmountRemovedEvent(event)
        case et: EventType.UsableUpdated      => applyUsableUpdatedEvent(event)
        case et: EventType.Removed            => applyRemovedEvent(event)

        case event => log.error(s"event not handled: $event")
      }

    case SnapshotOffer(_, snapshotFilename: String) =>
      applySnapshot(snapshotFilename)

    case RecoveryCompleted =>
      log.debug("SpecimensProcessor: recovery completed")

    case msg =>
      log.error(s"message not handled: $msg")
  }

  /**
   * These are the commands that are requested. A command can fail, and will send the failure as a response
   * back to the user. Each valid command generates one or more events and is journaled.
   */
  @SuppressWarnings(Array("org.wartremover.warts.Any", "org.wartremover.warts.Throw"))
  val receiveCommand: Receive = {
    case cmd: AddSpecimensCmd =>
      process(addCmdToEvent(cmd))(applyAddedEvent)

    case cmd: MoveSpecimensCmd =>
      process(moveCmdToEvent(cmd))(applyMovedEvent)

    case cmd: SpecimenAssignPositionCmd =>
      processUpdateCmd(cmd, assignPositionCmdToEvent, applyPositionAssignedEvent)

    case cmd: SpecimenRemoveAmountCmd =>
      processUpdateCmd(cmd, removeAmountCmdToEvent, applyAmountRemovedEvent)

    case cmd: SpecimenUpdateUsableCmd =>
      processUpdateCmd(cmd, updateUsableCmdToEvent, applyUsableUpdatedEvent)

    case cmd: RemoveSpecimenCmd =>
      processUpdateCmd(cmd, removeCmdToEvent, applyRemovedEvent)

    case "snap" =>
     mySaveSnapshot

    case SaveSnapshotSuccess(metadata) =>
      log.debug(s"snapshot saved successfully: ${metadata}")

    case SaveSnapshotFailure(metadata, reason) =>
      log.error(s"snapshot save error: ${metadata}")
      reason.printStackTrace

    case "persistence_restart" =>
      throw new Exception(
        "SpecimensProcessor: Intentionally throwing exception to test persistence by restarting the actor")

    case msg =>
      log.error(s"specimensProcessor: message not handled: $msg")
  }

  private def mySaveSnapshot(): Unit = {
    val snapshotState = SnapshotState(specimenRepository.getValues.toSet)
    val filename = snapshotWriter.save(persistenceId, Json.toJson(snapshotState).toString)
    log.debug(s"saved snapshot to: $filename")
    saveSnapshot(filename)
  }

  private def applySnapshot(filename: String): Unit = {
    log.info(s"snapshot recovery file: $filename")
    val fileContents = snapshotWriter.load(filename);
    Json.parse(fileContents).validate[SnapshotState].fold(
      errors => log.error(s"could not apply snapshot: $filename: $errors"),
      snapshot =>  {
        log.debug(s"snapshot contains ${snapshot.specimens.size} collection events")
        snapshot.specimens.foreach(specimenRepository.put)
      }
    )
  }

  private def addCmdToEvent(cmd: AddSpecimensCmd): ServiceValidation[SpecimenEvent] = {
    for {
      collectionEvent <- collectionEventRepository.getByKey(CollectionEventId(cmd.collectionEventId))
      ceventType      <- collectionEventTypeRepository.getByKey(collectionEvent.collectionEventTypeId)
      specIdsValid    <- validateSpecimenInfo(cmd.specimenData, ceventType)
      invIdsValid     <- validateInventoryId(cmd.specimenData)
    } yield SpecimenEvent(cmd.userId).update(
      _.time                    := ISODateTimeFormat.dateTime.print(DateTime.now),
      _.added.collectionEventId := collectionEvent.id.id,
      _.added.specimenData      := cmd.specimenData.map { specimenInfo =>
          specimenInfoToEvent(specimenRepository.nextIdentity, specimenInfo)
        })
  }

  private def moveCmdToEvent(cmd: MoveSpecimensCmd): ServiceValidation[SpecimenEvent] = {
    ???
  }

  private def assignPositionCmdToEvent(cmd: SpecimenAssignPositionCmd,
                                        cevent:   CollectionEvent,
                                        specimen: Specimen): ServiceValidation[SpecimenEvent] = {
    ???
  }

  private def removeAmountCmdToEvent(cmd: SpecimenRemoveAmountCmd,
                                      cevent:   CollectionEvent,
                                      specimen: Specimen): ServiceValidation[SpecimenEvent] = {
    ???
  }

  private def updateUsableCmdToEvent(cmd: SpecimenUpdateUsableCmd,
                                      cevent:   CollectionEvent,
                                      specimen: Specimen): ServiceValidation[SpecimenEvent] = {
    ???
  }

  private def removeCmdToEvent(cmd:      RemoveSpecimenCmd,
                               cevent:   CollectionEvent,
                               specimen: Specimen): ServiceValidation[SpecimenEvent] = {
    specimenHasNoChildren(specimen).map( _ =>
      SpecimenEvent(cmd.userId).update(
        _.time                      := ISODateTimeFormat.dateTime.print(DateTime.now),
        _.removed.version           := specimen.version,
        _.removed.specimenId        := specimen.id.id,
        _.removed.collectionEventId := cevent.id.id)
    )
  }

  private def applyAddedEvent(event: SpecimenEvent): Unit = {
    val v = for {
        validEventType <- validEventType(event.eventType.isAdded)
        specimens      <- {
          event.getAdded.specimenData.toList.traverseU { info =>
            UsableSpecimen.create(id               = SpecimenId(info.getId),
                                  inventoryId      = info.getInventoryId,
                                  specimenSpecId   = info.getSpecimenSpecId,
                                  version          = 0L,
                                  originLocationId = LocationId(info.getLocationId),
                                  locationId       = LocationId(info.getLocationId),
                                  containerId      = None,
                                  positionId       = None,
                                  timeAdded        = ISODateTimeFormat.dateTime.parseDateTime(event.getTime),
                                  timeCreated      = ISODateTimeParser.parseDateTime(info.getTimeCreated),
                                  amount           = BigDecimal(info.getAmount))
          }
        }
      } yield specimens

    if (v.isFailure) {
      log.error(s"*** ERROR ***: $v, event: $event: ")
    }

    v.foreach { specimens =>
      val ceventId = CollectionEventId(event.getAdded.getCollectionEventId)
      specimens.foreach { specimen =>
        log.info(s"------------> $specimen")
        specimenRepository.put(specimen)
        ceventSpecimenRepository.put(CeventSpecimen(ceventId, specimen.id))
      }
    }
  }

  private def applyMovedEvent(event: SpecimenEvent): Unit = {
    ???
  }

  private def applyPositionAssignedEvent(event: SpecimenEvent): Unit = {
    ???
  }

  private def applyAmountRemovedEvent(event: SpecimenEvent): Unit = {
    ???
  }

  private def applyUsableUpdatedEvent(event: SpecimenEvent): Unit = {
    ???
  }

  private def applyRemovedEvent(event: SpecimenEvent): Unit = {
    val v = for {
        validEventType  <- validEventType(event.eventType.isRemoved)
        specimen        <- specimenRepository.getByKey(SpecimenId(event.getRemoved.getSpecimenId))
        validVersion    <- specimen.requireVersion(event.getRemoved.getVersion)
        collectionEvent <- collectionEventRepository.getByKey(CollectionEventId(event.getRemoved.getCollectionEventId))
      } yield {
        ceventSpecimenRepository.remove(CeventSpecimen(collectionEvent.id, specimen.id))
        specimenRepository.remove(specimen)
      }

    if (v.isFailure) {
      log.error(s"*** ERROR ***: $v, event: $event: ")
    }
  }

  private def processUpdateCmd[T <: SpecimenModifyCommand](
    cmd: T,
    validation: (T, CollectionEvent, Specimen) => ServiceValidation[SpecimenEvent],
    applyEvent: SpecimenEvent => Unit): Unit = {

    val specimenId = SpecimenId(cmd.id)
    val collectionEventId = CollectionEventId(cmd.collectionEventId)

    val event = for {
        pair         <- ceventSpecimenRepository.withSpecimenId(specimenId)
        specimen     <- specimenRepository.getByKey(specimenId)
        cevent       <- collectionEventRepository.getByKey(collectionEventId)
        validVersion <- specimen.requireVersion(cmd.expectedVersion)
        event        <- validation(cmd, cevent, specimen)
      } yield event
    process(event)(applyEvent)
  }

  private def validateSpecimenInfo(specimenData: List[SpecimenInfo], ceventType: CollectionEventType)
      : ServiceValidation[Boolean] = {

    val cmdSpecIds    = specimenData.map(s => s.specimenSpecId).toSet
    val ceventSpecIds = ceventType.specimenSpecs.map(s => s.uniqueId).toSet
    val notBelonging  = cmdSpecIds.diff(ceventSpecIds)

    if (notBelonging.isEmpty) true.successNel[String]
    else EntityCriteriaError("specimen specs do not belong to collection event type: "
                               + notBelonging.mkString(", ")).failureNel[Boolean]
  }

  /**
   * Returns success if none of the inventory IDs are found in the repository.
   *
   */
  private def validateInventoryId(specimenData: List[SpecimenInfo]): ServiceValidation[Boolean] = {
    specimenData.map { info =>
      specimenRepository.getByInventoryId(info.inventoryId) fold (
        err => true.successNel[String],
        spc => s"specimen ID already in use: ${info.inventoryId}".failureNel[Boolean]
      )
    }.sequenceU.map { x => true }
  }

  private def validEventType(eventType: Boolean): ServiceValidation[Boolean] =
    if (eventType) true.successNel[String]
    else s"invalid event type".failureNel[Boolean]

  private def specimenHasNoChildren(specimen: Specimen): ServiceValidation[Boolean] = {
    val children = processingEventInputSpecimenRepository.withSpecimenId(specimen.id)
    if (children.isEmpty) true.successNel[String]
    else ServiceError(s"specimen has child specimens: ${specimen.id}").failureNel[Boolean]
  }
}
