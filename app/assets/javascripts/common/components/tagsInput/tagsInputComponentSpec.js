/**
 * Jasmine test suite
 *
 * @author Nelson Loyola <loyola@ualberta.ca>
 * @copyright 2018 Canadian BioSample Repository (CBSR)
 */
/* global angular */

import { ComponentTestSuiteMixin } from 'test/mixins/ComponentTestSuiteMixin';
import _ from 'lodash'
import faker from 'faker'
import ngModule from '../../../app'

describe('tagsInputComponent', function() {

  beforeEach(() => {
    angular.mock.module(ngModule, 'biobank.test')
    angular.mock.inject(function() {
      Object.assign(this, ComponentTestSuiteMixin)

      this.injectDependencies('Factory')

      this.createController =
        (label,
         placeholder,
         tagsPlaceholder,
         noResultsFound,
         noTagsErrorMessage,
         onGetValues,
         onTagSelected,
         onTagRemoved,
         required) => {
           this.createControllerInternal(
             `<form name="testForm">
                 <tags-input label="${label}"
                             placeholder="${placeholder}"
                             tags-placeholder="${tagsPlaceholder}"
                             no-results-found="${noResultsFound}"
                             no-tags-error-message="${noTagsErrorMessage}"
                             on-get-values="vm.onGetValues"
                             on-tag-selected="vm.onTagSelected"
                             on-tag-removed="vm.onTagRemoved"
                             required="${required ? 'true' : 'false'}">
                 </tags-input>
              </form>`,
             {
               onGetValues,
               onTagSelected,
               onTagRemoved
             },
             'tagsInput')
           this.controller = this.element.find('tags-input').controller('tagsInput')
         }

      this.getTags = (numTags) => _.range(numTags).map(() => {
        const word = faker.lorem.word()
        return { label: word, obj: word }
      })
    })
  })

  it('has valid scope', function() {
    const label              = this.Factory.stringNext(),
          placeholder        = this.Factory.stringNext(),
          tagsPlaceholder    = this.Factory.stringNext(),
          noResultsFound     = this.Factory.stringNext(),
          noTagsErrorMessage = this.Factory.stringNext(),
          onGetValues        = jasmine.createSpy().and.returnValue(faker.lorem.word(3)),
          onTagSelected      = jasmine.createSpy().and.returnValue(null),
          onTagRemoved       = jasmine.createSpy().and.returnValue(null),
          required           = true
    this.createController(label,
                          placeholder,
                          tagsPlaceholder,
                          noResultsFound,
                          noTagsErrorMessage,
                          onGetValues,
                          onTagSelected,
                          onTagRemoved,
                          required)

    expect(this.controller.label).toBe(label)
    expect(this.controller.placeholder).toBe(placeholder)
    expect(this.controller.tagsPlaceholder).toBe(tagsPlaceholder)
    expect(this.controller.noResultsFound).toBe(noResultsFound)
    expect(this.controller.noTagsErrorMessage).toBe(noTagsErrorMessage)
    expect(this.controller.onGetValues).toBeFunction()
    expect(this.controller.onTagSelected).toBeFunction()
    expect(this.controller.onTagRemoved).toBeFunction()
    expect(this.controller.required).toBe(required)
  })

  describe('for callbacks', function() {

    beforeEach(function() {
      this.tags          = this.getTags(3)
      this.onGetValues   = jasmine.createSpy().and.returnValue(this.tags)
      this.onTagSelected = jasmine.createSpy().and.returnValue(null)
      this.onTagRemoved  = jasmine.createSpy().and.returnValue(null)
      this.createController(this.Factory.stringNext(),
                            this.Factory.stringNext(),
                            this.Factory.stringNext(),
                            this.Factory.stringNext(),
                            this.Factory.stringNext(),
                            this.onGetValues,
                            this.onTagSelected,
                            this.onTagRemoved,
                            false)
    })


    it('function assigned to onGetValues is called', function() {
      const inputValue = this.Factory.stringNext()
      this.controller.getValues(inputValue)
      this.scope.$digest()
      expect(this.onGetValues).toHaveBeenCalledWith(inputValue)
    })

    it('function assigned to onTagSelected is called', function() {
      const tag = this.tags[1]
      this.controller.tagSelected(tag)
      this.scope.$digest()
      expect(this.onTagSelected).toHaveBeenCalled()
      const args = this.onTagSelected.calls.argsFor(0)
      expect(args[0]).toBe(tag.obj)
    })

    it('function assigned to onTagRemoved is called', function() {
      const tag = this.tags[1]
      this.controller.tagSelected(tag)
      this.scope.$digest()
      this.controller.tagRemoved(tag)
      this.scope.$digest()
      expect(this.onTagRemoved).toHaveBeenCalled()
      const args = this.onTagRemoved.calls.argsFor(0)
      expect(args[0]).toBe(tag.obj)
    })

  })

  it('form valid when a tag is selected', function() {
    const tags          = this.getTags(3),
          selectedTag   = tags[1],
          onGetValues   = jasmine.createSpy().and.returnValue(tags),
          onTagSelected = jasmine.createSpy().and.returnValue(null),
          onTagRemoved  = jasmine.createSpy().and.returnValue(null)

    this.createController(this.Factory.stringNext(),
                          this.Factory.stringNext(),
                          this.Factory.stringNext(),
                          this.Factory.stringNext(),
                          this.Factory.stringNext(),
                          onGetValues,
                          onTagSelected,
                          onTagRemoved,
                          true)

    this.controller.tagSelected(selectedTag)
    this.scope.$digest()
    expect(this.scope.testForm.tagsForm.tagsInput.$invalid).toBeFalse()
  })

  it('form is invalid when all tags are removed', function() {
    const tags          = this.getTags(1),
          tagToRemove   = tags[0],
          onGetValues   = jasmine.createSpy().and.returnValue(tags),
          onTagSelected = jasmine.createSpy().and.returnValue(null),
          onTagRemoved  = jasmine.createSpy().and.returnValue(null)

    this.createController(this.Factory.stringNext(),
                          this.Factory.stringNext(),
                          this.Factory.stringNext(),
                          this.Factory.stringNext(),
                          this.Factory.stringNext(),
                          onGetValues,
                          onTagSelected,
                          onTagRemoved,
                          true)

    tags.forEach(tag => {
      this.controller.tagSelected(tag)
    })

    this.controller.tagRemoved(tagToRemove)
    this.scope.$digest()
    expect(this.scope.testForm.tagsForm.tagsInput.$invalid).toBeTrue()
  })

  it('exception is thrown when an invalid tag is removed', function() {
    const tags          = this.getTags(1),
          tagToRemove   = this.getTags(1)[0],
          onGetValues   = jasmine.createSpy().and.returnValue(tags),
          onTagSelected = jasmine.createSpy().and.returnValue(null),
          onTagRemoved  = jasmine.createSpy().and.returnValue(null)

    this.createController(this.Factory.stringNext(),
                          this.Factory.stringNext(),
                          this.Factory.stringNext(),
                          this.Factory.stringNext(),
                          this.Factory.stringNext(),
                          onGetValues,
                          onTagSelected,
                          onTagRemoved,
                          true)

    expect(() => this.controller.tagRemoved(tagToRemove)).toThrowError(/tag was never selected/)
  })

})
