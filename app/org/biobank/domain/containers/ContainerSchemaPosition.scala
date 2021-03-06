package org.biobank.domain.containers

import org.biobank.ValidationKey
import org.biobank.domain._

import play.api.libs.json._
import scalaz.Scalaz._

trait ContainerSchemaPositionValidations {

  val LabelMinLength: Long = 2L

  case object InvalidContainerSchemaId extends ValidationKey

  case object InvalidLabel extends ValidationKey
}

/**
 * Represents a labelled position that a child (e.g. a [[Container]] or a [[domain.participants.Specimen Specimen]]) has in a
 * parent [[Container]]. Labels are associated with a single [[ContainerSchema]].
 *
 * This is a value object because it must be referenced and the [[label]] could be quite long.
 */
final case class ContainerSchemaPosition(id:       ContainerSchemaPositionId,
                                         schemaId: ContainerSchemaId,
                                         label:    String)
    extends IdentifiedDomainObject[ContainerSchemaPositionId]

object ContainerSchemaPosition extends ContainerSchemaPositionValidations {
  import org.biobank.CommonValidations._
  import org.biobank.domain.DomainValidations._

  def create(id:       ContainerSchemaPositionId,
             schemaId: ContainerSchemaId,
             label:    String)
      : DomainValidation[ContainerSchemaPosition] = {
    (validateId(id) |@|
      validateId(schemaId, InvalidContainerSchemaId) |@|
       validateString(label, LabelMinLength, InvalidLabel)) { case _ =>
        ContainerSchemaPosition(id, schemaId, label)
    }
  }

  implicit val containerSchemPositionWrites: Writes[ContainerSchemaPosition] =
    Json.writes[ContainerSchemaPosition]

}
