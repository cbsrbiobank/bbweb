package org.biobank.services.centres

import org.biobank.services._
import org.biobank.services.Comparator._
import org.biobank.services.QueryFilterParserGrammar._
import org.biobank.services.{ServiceValidation, ServiceError}
import org.biobank.domain.PredicateHelper
import org.biobank.domain.centres.{ShipmentItemState, ShipmentSpecimen, ShipmentSpecimenPredicates}
import org.slf4j.{Logger, LoggerFactory}
import scalaz.Scalaz._
import scalaz.Validation.FlatMap._

/**
 * Functions that filter a set of shipment specimens from an expression contained in a filter string.
 *
 */
object ShipmentSpecimenFilter extends PredicateHelper with ShipmentSpecimenPredicates {
  import org.biobank.CommonValidations._

  val log: Logger = LoggerFactory.getLogger(this.getClass)

  def filterShipmentSpecimens(shipmentSpecimens: Set[ShipmentSpecimen],
                              filter:            FilterString):ServiceValidation[Set[ShipmentSpecimen]] = {
    QueryFilterParser.expressions(filter).flatMap { filterExpression =>
      filterExpression match {
        case None =>
          shipmentSpecimens.successNel[String]
        case Some(c: Comparison) =>
          comparisonToPredicates(c).map(shipmentSpecimens.filter)
        case Some(e: AndExpression) =>
          comparisonToPredicates(e).map(shipmentSpecimens.filter)
        case Some(e: OrExpression) =>
          comparisonToPredicates(e).map(shipmentSpecimens.filter)
        case _ =>
          ServiceError(s"bad filter expression: $filterExpression").failureNel[Set[ShipmentSpecimen]]
      }
    }
  }

  @SuppressWarnings(Array("org.wartremover.warts.Recursion"))
  def comparisonToPredicates(expression: Expression): ServiceValidation[ShipmentSpecimenFilter] = {
    expression match {
      case Comparison(selector, comparator, args) =>
        selector match {
          case "state"          => stateFilter(comparator, args)
          case _ =>
            ServiceError(s"invalid filter selector: $selector").failureNel[ShipmentSpecimenFilter]
        }
      case AndExpression(expressions) =>
        expressions.map(comparisonToPredicates).sequenceU.map(x => every(x:_*))
      case OrExpression(expressions) =>
        expressions.map(comparisonToPredicates).sequenceU.map(x => any(x:_*))
      case _ =>
        ServiceError(s"invalid filter expression: $expression").failureNel[ShipmentSpecimenFilter]
    }
  }

  private def stateFilter(comparator: Comparator, stateNames: List[String]) = {
    stateNames.
      map { str =>
        ShipmentItemState.values.find(_.toString == str).
          toSuccessNel(InvalidState(s"shipment specimen state does not exist: $str").toString)
      }.
      toList.
      sequenceU.
      flatMap { states =>
        val stateSet = states.toSet

        comparator match {
          case Equal | In =>
            stateIsOneOf(stateSet).successNel[String]
          case NotEqualTo | NotIn =>
            complement(stateIsOneOf(stateSet)).successNel[String]
          case _ =>
          ServiceError(s"invalid filter on state: $comparator").failureNel[ShipmentSpecimenFilter]
        }
      }
  }
}