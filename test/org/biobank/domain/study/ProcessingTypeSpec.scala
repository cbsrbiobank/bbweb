package org.biobank.domain.study

import org.biobank.domain.DomainSpec
import org.biobank.infrastructure._
import org.biobank.fixture.NameGenerator

import org.slf4j.LoggerFactory
import scalaz._
import scalaz.Scalaz._

class ProcessingTypeSpec extends DomainSpec {

  val log = LoggerFactory.getLogger(this.getClass)

  val nameGenerator = new NameGenerator(this.getClass)

  "A processing type" can {

    "be created" in {
      val disabledStudy = factory.defaultDisabledStudy
      val processingTypeId = processingTypeRepository.nextIdentity
      val name = nameGenerator.next[ProcessingType]
      val description = Some(nameGenerator.next[ProcessingType])
      val enabled = true

      val validation = ProcessingType.create(disabledStudy.id, processingTypeId, -1L, name,
              description, enabled)
      validation should be ('success)
      validation map { processingType =>
        processingType shouldBe a [ProcessingType]
        processingType should have (
          'studyId (disabledStudy.id),
          'version (0L),
          'name (name),
          'description (description),
          'enabled (enabled)
        )
      }
    }

  }

  "A processing type" should {

    "not be created with an empty study id" in {
      val studyId = StudyId("")
      val processingTypeId = processingTypeRepository.nextIdentity
      val name = nameGenerator.next[ProcessingType]
      val description = Some(nameGenerator.next[ProcessingType])
      val enabled = true

      val validation = ProcessingType.create(studyId, processingTypeId, -1L, name,
              description, enabled)
      validation should be('failure)
      validation.swap.map { err =>
          err.list should (have length 1 and contain("study id is null or empty"))
      }
    }


    "not be created with an empty id" in {
      val disabledStudy = factory.defaultDisabledStudy
      val processingTypeId = ProcessingTypeId("")
      val name = nameGenerator.next[ProcessingType]
      val description = Some(nameGenerator.next[ProcessingType])
      val enabled = true

      val validation = ProcessingType.create(disabledStudy.id, processingTypeId, -1L, name,
              description, enabled)
      validation should be('failure)
      validation.swap.map { err =>
          err.list should (have length 1 and contain("processing type id is null or empty"))
      }
    }

    "not be created with an invalid version" in {
      val disabledStudy = factory.defaultDisabledStudy
      val processingTypeId = processingTypeRepository.nextIdentity
      val name = nameGenerator.next[ProcessingType]
      val description = Some(nameGenerator.next[ProcessingType])
      val enabled = true

      val validation = ProcessingType.create(disabledStudy.id, processingTypeId, -2L, name,
              description, enabled)
      validation should be('failure)
      validation.swap.map { err =>
          err.list should (have length 1 and contain("invalid version value: -2"))
      }
    }

    "not be created with an null or empty name" in {
      val disabledStudy = factory.defaultDisabledStudy
      val processingTypeId = processingTypeRepository.nextIdentity
      var name: String = null
      val description = Some(nameGenerator.next[ProcessingType])
      val enabled = true

      val validation = ProcessingType.create(disabledStudy.id, processingTypeId, -1L, name,
              description, enabled)
      validation should be ('failure)
      validation.swap.map { err =>
          err.list should (have length 1 and contain("name is null or empty"))
      }

      name = ""
      val validation2 = ProcessingType.create(disabledStudy.id, processingTypeId, -1L, name,
              description, enabled)
      validation2 should be ('failure)
      validation2.swap.map { err =>
          err.list should (have length 1 and contain("name is null or empty"))
      }
    }

    "not be created with an empty description option" in {
      val disabledStudy = factory.defaultDisabledStudy
      val processingTypeId = processingTypeRepository.nextIdentity
      val name = nameGenerator.next[ProcessingType]
      var description: Option[String] = Some(null)
      val enabled = true

      val validation = ProcessingType.create(disabledStudy.id, processingTypeId, -1L, name,
              description, enabled)
      validation should be ('failure)
      validation.swap.map { err =>
          err.list should (have length 1 and contain("description is null or empty"))
      }

      description = Some("")
      val validation2 = ProcessingType.create(disabledStudy.id, processingTypeId, -1L, name,
              description, enabled)
      validation2 should be ('failure)
      validation2.swap.map { err =>
          err.list should (have length 1 and contain("description is null or empty"))
      }
    }

    "have more than one validation fail" in {
      val disabledStudy = factory.defaultDisabledStudy
      val processingTypeId = processingTypeRepository.nextIdentity
      val name = nameGenerator.next[ProcessingType]
      var description: Option[String] = Some(null)
      val enabled = true

      val validation = ProcessingType.create(disabledStudy.id, processingTypeId, -2L, name,
              description, enabled)
      validation should be ('failure)
      validation.swap.map { err =>
          err.list should have length 2
          err.list(0) should be ("invalid version value: -2")
          err.list(1) should be ("description is null or empty")
      }
    }
  }

}