package org.biobank.domain

import org.biobank.fixture.NameGenerator
import org.biobank.domain._
import org.biobank.domain.study._
import org.slf4j.LoggerFactory
import scala.reflect.ClassTag
import scala.reflect._
import scalaz._
import scalaz.Scalaz._

class Factory(nameGenerator: NameGenerator) {
  this: RepositoryComponentImpl =>

  val log = LoggerFactory.getLogger(this.getClass)

  var domainObjects: Map[Class[_ <: ConcurrencySafeEntity[_]], ConcurrencySafeEntity[_]] = Map.empty

  def createRegisteredUser: RegisteredUser = {
    val version = -1L
    val name = nameGenerator.next[User]
    val email = "user1@test.com"
    val id = UserId(email)
    val password = nameGenerator.next[User]
    val hasher = nameGenerator.next[User]
    val salt = Some(nameGenerator.next[User])
    val avatarUrl = Some("http://test.com/")

    val validation = RegisteredUser.create(
      id, version, name, email, password, hasher, salt, avatarUrl)
    if (validation.isFailure) {
      throw new Error
    }

    val user = validation | null
    domainObjects = domainObjects + (classOf[RegisteredUser] -> user)
    user
  }

  def createActiveUser: ActiveUser = {
    val registeredUser = defaultRegisteredUser
    val validation = registeredUser.activate(registeredUser.versionOption)
    if (validation.isFailure) {
      throw new Error
    }

    val user = validation | null
    domainObjects = domainObjects + (classOf[ActiveUser] -> user)
    user
  }

  def createDisabledStudy: DisabledStudy = {
    val id = studyRepository.nextIdentity
    val name = nameGenerator.next[Study]
    val description = Some(nameGenerator.next[Study])

    val validation = DisabledStudy.create(id, -1L, name, description)
    if (validation.isFailure) {
      throw new Error
    }

    val study = validation | null
    domainObjects = domainObjects + (classOf[DisabledStudy] -> study)
    study
  }

  def createEnabledStudy: EnabledStudy = {
    val disabledStudy = defaultDisabledStudy
    val enabledStudy = disabledStudy.enable(disabledStudy.versionOption, 1, 1) | null
    domainObjects = domainObjects + (classOf[EnabledStudy] -> enabledStudy)
    domainObjects = domainObjects - classOf[DisabledStudy]
    enabledStudy
  }

  def createSpecimenGroup: SpecimenGroup = {
    val sgId = specimenGroupRepository.nextIdentity
    val name = nameGenerator.next[SpecimenGroup]
    val description = Some(nameGenerator.next[SpecimenGroup])
    val units = nameGenerator.next[String]
    val anatomicalSourceType = AnatomicalSourceType.Blood
    val preservationType = PreservationType.FreshSpecimen
    val preservationTempType = PreservationTemperatureType.Minus80celcius
    val specimenType = SpecimenType.FilteredUrine

    val disabledStudy = defaultDisabledStudy
    val validation = SpecimenGroup.create(disabledStudy.id, sgId, -1L,
      name, description, units, anatomicalSourceType, preservationType, preservationTempType,
      specimenType)
    if (validation.isFailure) {
      throw new Error
    }

    val specimenGroup = validation | null
    domainObjects = domainObjects + (classOf[SpecimenGroup] -> specimenGroup)
    specimenGroup
  }

  def createCollectionEventType: CollectionEventType = {
    val ceventTypeId = collectionEventTypeRepository.nextIdentity
    val name = nameGenerator.next[CollectionEventType]
    val description = Some(nameGenerator.next[CollectionEventType])

    val disabledStudy = defaultDisabledStudy
    val validation = CollectionEventType.create(disabledStudy.id, ceventTypeId, -1L, name,
      description, true, List.empty, List.empty)
    if (validation.isFailure) {
      throw new Error
    }

    val ceventType = validation | null
    domainObjects = domainObjects + (classOf[CollectionEventType] -> ceventType)
    ceventType
  }

  /** Retrieves the class from the map, or calls 'create' if value does not exist
    */
  private def defaultObject[T <: org.biobank.domain.ConcurrencySafeEntity[_]](
    key: Class[T], create: => T): T = {
    domainObjects get key match {
      case Some(obj) => key.cast(obj)
      case None => create
    }
  }

  def defaultRegisteredUser: RegisteredUser = {
    defaultObject(classOf[RegisteredUser], createRegisteredUser)
  }

  def defaultActivUser: ActiveUser = {
    defaultObject(classOf[ActiveUser], createActiveUser)
  }

  def defaultDisabledStudy: DisabledStudy = {
    defaultObject(classOf[DisabledStudy], createDisabledStudy)
  }

  def defaultEnabledStudy: EnabledStudy = {
    defaultObject(classOf[EnabledStudy], createEnabledStudy)
  }

  def defaultSpecimenGroup: SpecimenGroup = {
    defaultObject(classOf[SpecimenGroup], createSpecimenGroup)
  }

  def defaultCollectionEventType: CollectionEventType = {
    defaultObject(classOf[CollectionEventType], createCollectionEventType)
  }

}
