/**
 * Jasmine shared behaviour
 */

/**
 *
 * @param {function } context.createController is a function that creates the controller and scope:
 * this.controller, and this.scope.
 *
 * @param {object} context.entity is the domain entity to which the annotation type will be added to.
 *
 * @param {string} context.addAnnotationTypeFuncName is the name of the function on context.entity which
 * adds the annotation type.
 *
 * @param {string} context.returnState the state to return after a successful add or when cancel is pressed.
 *
 * NOTE: requires that the test suite be extended with TestSuiteMixin.
 */
export default function annotationTypeAddComponentSharedSpec(context) {

  describe('(shared) tests', function() {

    beforeEach(function() {
      this.injectDependencies('$q',
                              '$state',
                              'AnnotationType',
                              'Factory');

      spyOn(this.$state, 'go').and.returnValue('ok');
    });

    it('should change to correct state on submit', function() {
      var annotType = new this.AnnotationType(this.Factory.annotationType());

      spyOn(context.entity.prototype, context.addAnnotationTypeFuncName)
        .and.returnValue(this.$q.when(this.study));

      context.createController.call(this);

      this.controller.submit(annotType);
      this.scope.$digest();
      expect(context.entity.prototype[context.addAnnotationTypeFuncName])
        .toHaveBeenCalledWith(annotType);
      expect(this.$state.go).toHaveBeenCalledWith(
        context.returnState, {}, { reload: true });
    });

    it('on cancel, the correct method should be called', function() {
      context.createController.call(this);
      this.controller.cancel();
      this.scope.$digest();
      expect(this.$state.go).toHaveBeenCalledWith(context.returnState, {}, { reload: true });
    });

  });
}
