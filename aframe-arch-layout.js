/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

        /**
         * Arch Layout component for A-Frame.
         */
        AFRAME.registerComponent('arch', {
            schema: {
                margin: {default: 1, min: 0},
                radius: {default: 1, min: 0},
                direction: {default:1, oneOf:[-1,1]}
            },

            /**
             * Store initial positions in case need to reset on component removal.
             */
            init: function () {
                var self = this;
                var el = this.el;
                this.initialPositions = [];

                this.children = el.getChildEntities();

                this.children.forEach(function getInitialPositions (childEl) {
                    self.initialPositions.push(childEl.getComputedAttribute('position'));
                });

                el.addEventListener('child-attached', function (evt) {
                    // Only update if direct child attached.
                    if (evt.detail.el.parentNode !== el) { return; }
                    self.children.push(evt.detail.el);
                    self.update();
                });
            },

            /**
             * Update child entity positions.
             */
            update: function (oldData) {
                var children = this.children;
                console.log(children);
                var data = this.data;
                console.log(data);
                var mLength = children.map(function(elem){return elem.getComputedAttribute('geometry').width});
                var el = this.el;
                var positions;
                var startPosition = el.getComputedAttribute('position');

                positions = getSeparatedCirclePositions(data, mLength, startPosition);
                setPositions(children, positions);
            },

            /**
             * Reset positions.
             */
            remove: function () {
                this.el.removeEventListener('child-attached', this.childAttachedCallback);
                setPositions(this.children, this.initialPositions);
            }
        });

        /**
         *
         * */
        function getSeparatedCirclePositions (data, mLength, startPosition) //direction = -1 для правой части (по часовой) и 1 для левой (против часовой), mLength - массив длин
        {
            var positions=[];

            var startX = 0, startZ = data.radius; //center on the screen
            var w = Math.PI/2, v=0;

            for(var i=0; i<mLength.length; i++)
            {
                v= data.direction*data.margin/2+ data.direction*Math.abs(Math.atan(mLength[i]/(2*data.radius)));
                w = w+v;

                positions.push([
                    startPosition.x + data.radius*Math.cos(w),
                    startPosition.y,
                    startPosition.z + data.radius*Math.sin(w)]);

                w = w+v;
            }

            return positions;

        }

        /**
         * Get positions for `circle` layout.
         * TODO: arcLength.
         */
        function getCirclePositions (data, numChildren, startPosition) {
            var positions = [];

            for (var i = 0; i < numChildren; i++) {
                var rad = i * (2 * Math.PI) / numChildren;
                positions.push([
                    startPosition.x + data.radius * Math.cos(rad),
                    startPosition.y,
                    startPosition.z + data.radius * Math.sin(rad)
                ]);
            }
            return positions;
        }
        module.exports.getCirclePositions = getCirclePositions;


        /**
         * Set position on child entities.
         *
         * @param {Array} els - Child entities to set.
         * @param {Array} positions - Array of coordinates.
         */
        function setPositions (els, positions) {
            els.forEach(function (el, i) {
                var position = positions[i];
                el.setAttribute('position', {
                    x: position[0],
                    y: position[1],
                    z: position[2]
                });
            });
        }


/***/ }
/******/ ]);
