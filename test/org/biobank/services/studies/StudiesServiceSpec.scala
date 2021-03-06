package org.biobank.services.studies

import org.biobank.fixtures._
import org.biobank.domain._
import org.biobank.domain.access._
import org.biobank.domain.annotations._
import org.biobank.domain.studies._
import org.biobank.domain.users._
import org.biobank.services.{FilterString, FilterAndSortQuery, PagedQuery, SortString}
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.prop.TableDrivenPropertyChecks._

/**
 * Primarily these are tests that exercise the User Access aspect of StudiesService.
 */
class StudiesServiceSpec
    extends ProcessorTestFixture
    with StudiesServiceFixtures
    with ScalaFutures {

  import org.biobank.TestUtils._
  import org.biobank.infrastructure.commands.StudyCommands._

  class StudyOfAllStatesFixure extends UsersWithStudyAccessFixture {
    val disabledStudy = study
    val enabledStudy = factory.createEnabledStudy
    val retiredStudy = factory.createRetiredStudy
    val cet = factory.createCollectionEventType
      .copy(studyId              = disabledStudy.id,
            specimenDefinitions = Set(factory.createCollectionSpecimenDefinition))

    Set(disabledStudy, enabledStudy, retiredStudy).foreach(addToRepository)
    collectionEventTypeRepository.put(cet)
    addToRepository(studyOnlyMembership.copy(
                      studyData = studyOnlyMembership.studyData.copy(
                          ids = Set(disabledStudy.id, enabledStudy.id, retiredStudy.id))))

  }

  protected val nameGenerator = new NameGenerator(this.getClass)

  protected val accessItemRepository = app.injector.instanceOf[AccessItemRepository]

  protected val membershipRepository = app.injector.instanceOf[MembershipRepository]

  protected val userRepository = app.injector.instanceOf[UserRepository]

  protected val studyRepository = app.injector.instanceOf[StudyRepository]

  protected val collectionEventTypeRepository = app.injector.instanceOf[CollectionEventTypeRepository]

  private val studiesService = app.injector.instanceOf[StudiesService]

  override protected def addToRepository[T <: ConcurrencySafeEntity[_]](entity: T): Unit = {
    entity match {
      case u: User       => userRepository.put(u)
      case i: AccessItem => accessItemRepository.put(i)
      case s: Study      => studyRepository.put(s)
      case m: Membership => membershipRepository.put(m)
      case _             => fail("invalid entity")
    }
  }

  private def updateCommandsTable(sessionUserId: UserId, study: Study, annotationType: AnnotationType) = {
    Table("study update commands",
          UpdateStudyNameCmd(
            sessionUserId   = Some(sessionUserId.id),
            id              = study.id.id,
            expectedVersion = study.version,
            name            = nameGenerator.next[String]
          ),
          UpdateStudyDescriptionCmd(
            sessionUserId   = Some(sessionUserId.id),
            id              = study.id.id,
            expectedVersion = study.version,
            description     = Some(nameGenerator.next[String])
          ),
          StudyAddParticipantAnnotationTypeCmd(
            sessionUserId   = Some(sessionUserId.id),
            id              = study.id.id,
            expectedVersion = study.version,
            name            = annotationType.name,
            description     = annotationType.description,
            valueType       = annotationType.valueType,
            maxValueCount   = annotationType.maxValueCount,
            options         = annotationType.options,
            required        = annotationType.required
          ),
          StudyUpdateParticipantAnnotationTypeCmd(
            sessionUserId    = Some(sessionUserId.id),
            id               = study.id.id,
            expectedVersion  = study.version,
            annotationTypeId = annotationType.id.id,
            name             = annotationType.name,
            description      = annotationType.description,
            valueType        = annotationType.valueType,
            maxValueCount    = annotationType.maxValueCount,
            options          = annotationType.options,
            required         = annotationType.required
          ),
          UpdateStudyRemoveAnnotationTypeCmd(
            sessionUserId    = Some(sessionUserId.id),
            id               = study.id.id,
            expectedVersion  = study.version,
            annotationTypeId = annotationType.id.id
          )
    )
  }

  private def stateChangeCommandsTable(sessionUserId:  UserId,
                                       disabledStudy:  DisabledStudy,
                                       enabledStudy:   EnabledStudy,
                                       retiredStudy:   RetiredStudy) =
    Table("user sate change commands",
          EnableStudyCmd(
            sessionUserId   = Some(sessionUserId.id),
            id              = disabledStudy.id.id,
            expectedVersion = disabledStudy.version
          ),
          DisableStudyCmd(
            sessionUserId   = Some(sessionUserId.id),
            id              = enabledStudy.id.id,
            expectedVersion = enabledStudy.version
          ),
          RetireStudyCmd(
            sessionUserId   = Some(sessionUserId.id),
            id              = disabledStudy.id.id,
            expectedVersion = disabledStudy.version
          ),
          UnretireStudyCmd(
            sessionUserId   = Some(sessionUserId.id),
            id              = retiredStudy.id.id,
            expectedVersion = retiredStudy.version
          )
    )

  override def beforeEach() {
    super.beforeEach()
    removeUsersFromRepository
    restoreRoles
    studyRepository.removeAll
  }

  describe("StudiesService") {

    describe("collection studies") {

      it("all types of users can access") {
        val f = new UsersWithStudyAccessFixture
        val query = FilterAndSortQuery(new FilterString(""), new SortString(""))

        forAll (f.usersCanReadTable) { (user, label) =>
          info(s"$label")
          studiesService.collectionStudies(user.id, query).futureValue.mustSucceed { results =>
            results must have size (0)
          }
        }

        info("no membership user")
        studiesService.collectionStudies(f.noMembershipUser.id, query).futureValue
          .mustSucceed { set =>
            set must have size (0)
          }

        info("no permission user")
        studiesService.collectionStudies(f.nonStudyPermissionUser.id, query).futureValue
          .mustSucceed { set =>
            set must have size (0)
          }
      }

    }

    describe ("for study counts") {

      it("users can access") {
        val f = new UsersWithStudyAccessFixture
        forAll (f.usersCanReadTable) { (user, label) =>
          info(s"$label")
          studiesService.getStudyCount(user.id) mustSucceed { count =>
            count must be (1)
          }
        }
      }

      it("users cannot access") {
        val f = new UsersWithStudyAccessFixture
        info("no membership user")
        studiesService.getStudyCount(f.noMembershipUser.id) mustSucceed { count =>
          count must be (0)
        }

        info("no permission user")
        studiesService.getStudyCount(f.nonStudyPermissionUser.id) mustFail "Unauthorized"
      }

    }

    describe ("for study counts by status") {

      it("users can access") {
        val f = new UsersWithStudyAccessFixture
        forAll (f.usersCanReadTable) { (user, label) =>
          info(label)
          studiesService.getCountsByStatus(user.id) mustSucceed { counts =>
            counts.total must be (1)
          }
        }
      }

      it("users cannot access") {
        val f = new UsersWithStudyAccessFixture
        info("no membership user")
        studiesService.getCountsByStatus(f.noMembershipUser.id) mustSucceed { count =>
          count.total must be (0)
        }

        info("no permission user")
        studiesService.getCountsByStatus(f.nonStudyPermissionUser.id) mustFail "Unauthorized"
      }

    }

    describe("for listing studies") {

      it("users can access") {
        val f = new UsersWithStudyAccessFixture
        val query = PagedQuery(new FilterString(""), new SortString(""), 0 , 1)

        forAll (f.usersCanReadTable) { (user, label) =>
          info(label)
          studiesService.getStudies(user.id, query).futureValue
            .mustSucceed { results =>
              results.items must have length (1)
            }
        }
      }

      it("users cannot access") {
        val f = new UsersWithStudyAccessFixture
        val query = PagedQuery(new FilterString(""), new SortString(""), 0 , 1)

        info("no membership user")
        studiesService.getStudies(f.noMembershipUser.id, query).futureValue
          .mustSucceed { results =>
            results.items must have length (0)
          }

        info("no permission user")
        studiesService.getStudies(f.nonStudyPermissionUser.id, query).futureValue
          .mustFail("Unauthorized")
      }

    }

    describe("for retrieving a study") {

      it("users can access") {
        val f = new UsersWithStudyAccessFixture
        forAll (f.usersCanReadTable) { (user, label) =>
          info(label)
          studiesService.getStudy(user.id, f.study.id) mustSucceed { result =>
            result.id must be (f.study.id)
          }
        }
      }

      it("users cannot access") {
        val f = new UsersWithStudyAccessFixture

        info("no membership user")
        studiesService.getStudy(f.noMembershipUser.id, f.study.id) mustFail "Unauthorized"

        info("no permission user")
        studiesService.getStudy(f.nonStudyPermissionUser.id, f.study.id) mustFail "Unauthorized"
      }

    }

    describe("for retrieve centres for a study") {

      it("users can access") {
        val f = new UsersWithStudyAccessFixture
        forAll (f.usersCanReadTable) { (user, label) =>
          info(label)
          studiesService.getCentresForStudy(user.id, f.study.id) mustSucceed { result =>
            result must have size (0)
          }
        }
      }

      it("users cannot access") {
        val f = new UsersWithStudyAccessFixture

        info("no membership user")
        studiesService.getCentresForStudy(f.noMembershipUser.id, f.study.id) mustFail "Unauthorized"

        info("no permission user")
        studiesService.getCentresForStudy(f.nonStudyPermissionUser.id, f.study.id) mustFail "Unauthorized"
      }

    }

    describe("when adding a study") {

      it("users can access") {
        val f = new UsersWithStudyAccessFixture

        forAll (f.usersCanAddOrUpdateTable) { (user, label) =>
          val cmd = AddStudyCmd(sessionUserId = Some(user.id.id),
                                name          = f.study.name,
                                description   = f.study.description)
          studyRepository.removeAll
          studiesService.processCommand(cmd).futureValue mustSucceed { s =>
            s.name must be (f.study.name)
          }
        }
      }

      it("users cannot access") {
        val f = new UsersWithStudyAccessFixture

        forAll (f.usersCannotAddOrUpdateTable) { (user, label) =>
          val cmd = AddStudyCmd(sessionUserId = Some(user.id.id),
                                name          = f.study.name,
                                description   = f.study.description)
          studiesService.processCommand(cmd).futureValue mustFail "Unauthorized"
        }
      }

    }

    describe("when updating a study") {

      it("users can access") {
        val f = new UsersWithStudyAccessFixture
        val annotationType = factory.createAnnotationType

        forAll (f.usersCanAddOrUpdateTable) { (user, label) =>
          info(label)

          forAll(updateCommandsTable(user.id, f.study, annotationType)) { cmd =>
            val study = cmd match {
                case _: StudyUpdateParticipantAnnotationTypeCmd | _: UpdateStudyRemoveAnnotationTypeCmd =>
                  f.study.copy(annotationTypes = Set(annotationType))
                case _ =>
                  f.study
              }

            studyRepository.put(study) // restore the study to it's previous state
            studiesService.processCommand(cmd).futureValue mustSucceed { s =>
              s.id must be (study.id)
            }
          }
        }
      }

      it("users cannot access") {
        val f = new UsersWithStudyAccessFixture
        val annotationType = factory.createAnnotationType

        forAll (f.usersCannotAddOrUpdateTable) { (user, label) =>
          info(label)
          studyRepository.put(f.study) // restore the study to it's previous state
          forAll(updateCommandsTable(user.id, f.study, annotationType)) { cmd =>
            studiesService.processCommand(cmd).futureValue mustFail "Unauthorized"
          }
        }
      }

    }

    describe("when changing a study's state") {

      it("users can access") {
        val f = new StudyOfAllStatesFixure
        forAll (f.usersCanAddOrUpdateTable) { (user, label) =>
          info(label)
          forAll(stateChangeCommandsTable(user.id,
                                          f.disabledStudy,
                                          f.enabledStudy,
                                          f.retiredStudy)) { cmd =>
            Set(f.disabledStudy, f.enabledStudy, f.retiredStudy).foreach(addToRepository)
            studiesService.processCommand(cmd).futureValue mustSucceed { s =>
              s.id.id must be (cmd.id)
            }
          }
        }
      }

      it("users cannot access") {
        val f = new StudyOfAllStatesFixure
        forAll (f.usersCannotAddOrUpdateTable) { (user, label) =>
          info(label)
          studyRepository.put(f.study) // restore the study to it's previous state
          forAll(stateChangeCommandsTable(user.id,
                                          f.disabledStudy,
                                          f.enabledStudy,
                                          f.retiredStudy)) { cmd =>
            studiesService.processCommand(cmd).futureValue mustFail "Unauthorized"
          }
        }
      }

    }

    describe("studies membership") {

      it("user has access to all studies corresponding his membership") {
        val f = new UsersWithStudyAccessFixture
        val secondStudy = factory.createDisabledStudy  // should show up in results
        addToRepository(secondStudy)

        val query = PagedQuery(new FilterString(""), new SortString(""), 0 , 10)
        studiesService.getStudies(f.allStudiesAdminUser.id, query).futureValue
          .mustSucceed { reply =>
            reply.items must have size (2)
            val studyIds = reply.items.map(c => c.id).sortBy(_.id)
            studyIds must equal (List(f.study.id, secondStudy.id).sortBy(_.id))
          }
      }

      it("user has access only to studies corresponding his membership") {
        val query = PagedQuery(new FilterString(""), new SortString(""), 0 , 1)
        val secondStudy = factory.createDisabledStudy  // should not show up in results
        addToRepository(secondStudy)

        val f = new UsersWithStudyAccessFixture
        studiesService.getStudies(f.studyOnlyAdminUser.id, query).futureValue
          .mustSucceed { reply =>
            reply.items must have size (1)
            reply.items.map(c => c.id) must contain (f.study.id)
          }
      }

      it("user does not have access to study if not in membership") {
        val query = PagedQuery(new FilterString(""), new SortString(""), 0 , 1)
        val f = new UsersWithStudyAccessFixture

        // remove all studies from membership
        val noStudiesMembership = f.studyOnlyMembership.copy(
            studyData = f.studyOnlyMembership.studyData.copy(ids = Set.empty[StudyId]))
        addToRepository(noStudiesMembership)

        // should not show up in results
        val study = factory.createDisabledStudy
        addToRepository(study)

        studiesService.getStudies(f.studyUser.id, query).futureValue
          .mustSucceed { reply =>
            reply.items must have size (0)
          }
      }

    }

  }

}
