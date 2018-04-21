package org.biobank.controllers.studies

import javax.inject.{Inject, Singleton}
import org.biobank.controllers._
import org.biobank.domain.Slug
import org.biobank.domain.studies.{StudyId, ProcessingTypeId}
import org.biobank.infrastructure.commands.ProcessingTypeCommands._
import org.biobank.services.studies.ProcessingTypeService
import play.api.libs.json._
import play.api.Environment
import play.api.mvc.{Action, ControllerComponents, Result}
import scala.concurrent.{ExecutionContext, Future}

@SuppressWarnings(Array("org.wartremover.warts.ImplicitParameter"))
@Singleton
class ProcessingTypesController @Inject() (
  controllerComponents: ControllerComponents,
  val action:           BbwebAction,
  val env:              Environment,
  val service:          ProcessingTypeService
) (
  implicit val ec: ExecutionContext
)
    extends CommandController(controllerComponents) {

  def get(studySlug: Slug, procTypeSlug: Slug): Action[Unit] =
    action(parse.empty) { implicit request =>
      val processingType = service.processingTypeBySlug(request.authInfo.userId, studySlug, procTypeSlug)
      validationReply(processingType)
    }

  def snapshot: Action[Unit] =
    action(parse.empty) { implicit request =>
      val reply = service.snapshotRequest(request.authInfo.userId).map { _ => true }
      validationReply(reply)
    }

  def addProcessingType(studyId: StudyId): Action[JsValue] =
    commandAction[AddCollectedProcessingTypeCmd](Json.obj("studyId" -> studyId))(processCommand)

  def updateProcessingType(studyId: StudyId, id: ProcessingTypeId): Action[JsValue] =
    commandAction[UpdateProcessingTypeCmd](Json.obj("studyId" -> studyId, "id" -> id))(processCommand)

  def removeProcessingType(studyId: StudyId, id: ProcessingTypeId, ver: Long): Action[Unit] =
    action.async(parse.empty) { implicit request =>
      val cmd = RemoveProcessingTypeCmd(request.authInfo.userId.id, studyId.id, id.id, ver)
      val future = service.processRemoveCommand(cmd)
      validationReply(future)
    }

  private def processCommand(cmd: ProcessingTypeCommand): Future[Result] = {
    val future = service.processCommand(cmd)
    validationReply(future)
  }

}