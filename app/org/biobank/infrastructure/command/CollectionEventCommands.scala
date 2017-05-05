package org.biobank.infrastructure.command

import org.biobank.domain.Annotation
import org.biobank.infrastructure.JsonUtils._

import Commands._

import play.api.libs.json._
import org.joda.time.DateTime

object CollectionEventCommands {

  trait CollectionEventCommand extends Command with HasSessionUserId

  trait CollectionEventModifyCommand
      extends CollectionEventCommand
      with HasIdentity
      with HasExpectedVersion

  final case class AddCollectionEventCmd(sessionUserId:         String,
                                         participantId:         String,
                                         collectionEventTypeId: String,
                                         timeCompleted:         DateTime,
                                         visitNumber:           Int,
                                         annotations:           List[Annotation])
      extends CollectionEventCommand

  final case class UpdateCollectionEventVisitNumberCmd(sessionUserId:   String,
                                                       id:              String,
                                                       expectedVersion: Long,
                                                       visitNumber:     Int)
      extends CollectionEventModifyCommand

  final case class UpdateCollectionEventTimeCompletedCmd(sessionUserId:   String,
                                                         id:              String,
                                                         expectedVersion: Long,
                                                         timeCompleted:   DateTime)
      extends CollectionEventModifyCommand

  final case class UpdateCollectionEventAnnotationCmd(sessionUserId:    String,
                                                      id:               String,
                                                      expectedVersion:  Long,
                                                      annotationTypeId: String,
                                                      stringValue:      Option[String],
                                                      numberValue:      Option[String],
                                                      selectedValues:   Set[String])
      extends CollectionEventModifyCommand

  final case class RemoveCollectionEventAnnotationCmd(sessionUserId:    String,
                                                      id:               String,
                                                      expectedVersion:  Long,
                                                      annotationTypeId: String)
      extends CollectionEventModifyCommand

  final case class RemoveCollectionEventCmd(sessionUserId:   String,
                                            id:              String,
                                            participantId:   String,
                                            expectedVersion: Long)
      extends CollectionEventModifyCommand

  implicit val addCollectionEventCmdReads: Reads[AddCollectionEventCmd]                                 = Json.reads[AddCollectionEventCmd]
  implicit val updateCollectionEventVisitNumberCmdReads: Reads[UpdateCollectionEventVisitNumberCmd]     = Json.reads[UpdateCollectionEventVisitNumberCmd]
  implicit val updateCollectionEventTimeCompletedCmdReads: Reads[UpdateCollectionEventTimeCompletedCmd] = Json.reads[UpdateCollectionEventTimeCompletedCmd]
  implicit val updateCollectionEventAnnotationCmdReads: Reads[UpdateCollectionEventAnnotationCmd]       = Json.reads[UpdateCollectionEventAnnotationCmd]
  implicit val removeCollectionEventCmdReads: Reads[RemoveCollectionEventCmd]                           = Json.reads[RemoveCollectionEventCmd]

}
