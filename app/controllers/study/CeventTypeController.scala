package controllers.study

import controllers._
import service._
import infrastructure._
import infrastructure.commands._
import domain._
import domain.study._
import views._

import scala.concurrent._
import scala.concurrent.duration._
import scala.concurrent.ExecutionContext.Implicits.global
import scala.language.postfixOps
import play.api._
import play.api.mvc._
import play.api.data._
import play.api.data.Forms._
import play.api.i18n.Messages
import play.Logger
import akka.util.Timeout
import securesocial.core.{ Identity, Authorization }

import scalaz._
import Scalaz._

case class CeventTypeFormObject(
  ceventTypeId: String, version: Long, studyId: String, name: String,
  description: Option[String], recurring: Boolean) {

  def getAddCmd: AddCollectionEventTypeCmd = {
    AddCollectionEventTypeCmd(studyId, name, description, recurring)
  }

  def getUpdateCmd: UpdateCollectionEventTypeCmd = {
    UpdateCollectionEventTypeCmd(
      ceventTypeId, Some(version), studyId, name, description, recurring)
  }
}

object CollectionEventTypeSelections {
  val annotationValueTypes = Seq("" -> Messages("biobank.form.selection.default")) ++
    AnnotationValueType.values.map(x =>
      x.toString -> Messages("biobank.enumaration.annotation.value.type." + x.toString)).toSeq
}

object CeventTypeController extends Controller with securesocial.core.SecureSocial {

  lazy val studyService = Global.services.studyService

  val ceventTypeForm = Form(
    mapping(
      "ceventTypeId" -> text,
      "version" -> longNumber,
      "studyId" -> text,
      "name" -> nonEmptyText,
      "description" -> optional(text),
      "recurring" -> boolean)(CeventTypeFormObject.apply)(CeventTypeFormObject.unapply))

  def index(studyId: String, studyName: String) = SecuredAction { implicit request =>
    studyService.getCollectionEventTypes(studyId) match {
      case Failure(x) => throw new Error(x.head)
      case Success(ceventTypeSet) =>
        Ok(html.study.ceventtype.showCollectionEventTypes(studyId, studyName, ceventTypeSet))
    }
  }

  /**
   * Add an attribute type.
   */
  def addCeventType(studyId: String) = SecuredAction { implicit request =>
    studyService.getStudy(studyId) match {
      case Failure(x) => throw new Error(x.head)
      case Success(study) =>
        Ok(html.study.ceventtype.addCollectionEventType(ceventTypeForm, AddFormType(), studyId, study.name))
    }
  }

  def addCeventTypeSubmit(studyId: String, studyName: String) = SecuredAction { implicit request =>
    ceventTypeForm.bindFromRequest.fold(
      formWithErrors =>
        BadRequest(html.study.ceventtype.addCollectionEventType(
          formWithErrors, AddFormType(), studyId, studyName)),
      submittedForm => {
        Async {
          Logger.debug("ceventTypeForm: " + ceventTypeForm)
          implicit val userId = new UserId(request.user.id.id)
          studyService.addCollectionEventType(submittedForm.getAddCmd).map(validation =>
            validation match {
              case Success(ceventType) =>
                Redirect(routes.CeventTypeController.index(studyId, studyName)).flashing(
                  "success" -> Messages("biobank.study.collection.event.type.added", ceventType.name))
              case Failure(x) =>
                if (x.head.contains("name already exists")) {
                  val form = ceventTypeForm.fill(submittedForm).withError("name",
                    Messages("biobank.study.collection.event.type.form.error.name"))
                  Logger.debug("bad name: " + form)
                  BadRequest(html.study.ceventtype.addCollectionEventType(form, AddFormType(),
                    studyId, studyName))
                } else {
                  throw new Error(x.head)
                }
            })
        }
      })
  }

  def updateCeventType(studyId: String, studyName: String, ceventTypeId: String) = SecuredAction { implicit request =>
    studyService.getCollectionEventType(studyId, ceventTypeId) match {
      case Failure(x) => throw new Error(x.head)
      case Success(ceventType) =>
        val form = ceventTypeForm.fill(CeventTypeFormObject(
          ceventType.id.id, ceventType.version, ceventType.studyId.id, ceventType.name,
          ceventType.description, ceventType.recurring))
        Ok(html.study.ceventtype.addCollectionEventType(form, UpdateFormType(), studyId, studyName))
    }
  }

  def updateCeventTypeSubmit(studyId: String, studyName: String) = SecuredAction { implicit request =>
    ceventTypeForm.bindFromRequest.fold(
      formWithErrors => {
        Logger.debug("updateCeventTypeSubmit: formWithErrors: " + formWithErrors)
        BadRequest(html.study.ceventtype.addCollectionEventType(
          formWithErrors, AddFormType(), studyId, studyName))
      },
      submittedForm => {
        Async {
          implicit val userId = new UserId(request.user.id.id)
          studyService.updateCollectionEventType(submittedForm.getUpdateCmd).map(validation =>
            validation match {
              case Success(ceventType) =>
                Redirect(routes.CeventTypeController.index(studyId, studyName)).flashing(
                  "success" -> Messages("biobank.study.collection.event.type.updated", ceventType.name))
              case Failure(x) =>
                if (x.head.contains("name already exists")) {
                  val form = ceventTypeForm.fill(submittedForm).withError("name",
                    Messages("biobank.study.collection.event.type.form.error.name"))
                  BadRequest(html.study.ceventtype.addCollectionEventType(
                    form, UpdateFormType(), studyId, studyName))
                } else {
                  throw new Error(x.head)
                }
            })
        }
      })
  }

  def removeCeventTypeConfirm(studyId: String,
    studyName: String,
    ceventTypeId: String) = SecuredAction { implicit request =>
    studyService.getCollectionEventType(studyId, ceventTypeId) match {
      case Failure(x) => throw new Error(x.head)
      case Success(ceventType) =>
        Ok(html.study.ceventtype.removeCollectionEventTypeConfirm(studyId, studyName, ceventType))
    }
  }

  def removeCeventType(studyId: String,
    studyName: String,
    ceventTypeId: String) = SecuredAction { implicit request =>
    studyService.getCollectionEventType(studyId, ceventTypeId) match {
      case Failure(x) => throw new Error(x.head)
      case Success(ceventType) =>
        Async {
          implicit val userId = new UserId(request.user.id.id)
          studyService.removeCollectionEventType(
            RemoveCollectionEventTypeCmd(
              ceventType.id.id, ceventType.versionOption, ceventType.studyId.id)).map(validation =>
              validation match {
                case Success(ceventType) =>
                  Redirect(routes.CeventTypeController.index(studyId, studyName)).flashing(
                    "success" -> Messages("biobank.study.collection.event.type.removed", ceventType.name))
                case Failure(x) =>
                  throw new Error(x.head)
              })
        }
    }
  }
}