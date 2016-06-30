/**
 * Created by IvanP on 24.06.2016.
 */



function VRSurvey(scene){
    var HOST = scene.querySelector('#questionHost');
    var TEXT = HOST.querySelector('#textHost');
    var ANSWERS = HOST.querySelector('#answersHost');
    var QUESTIONS = [].slice.call(document.querySelectorAll('.questionarea')).filter(function(question){var excluded = question.querySelector('[id*=excluded]'); if(excluded){question.classList.add('excluded')}; return excluded?false:true;});
    console.log(QUESTIONS);
    var QUESTIONS_LENGTH = QUESTIONS.length;
    var TOGGLE_DISTANCE = 0.7;

    this.timer = [];

    /**
     * Sets question  as answered/not answered by adding/removing an '.answered' class to el `.questionarea`
     * @param {Object} question - object returned by `getQuestion()`
     * */
    this.setQuestionAnswered=function (question){
        if(this.questionIsAnswered(question)){
            question.node.classList.add('answered');
            this.hideNextButton(false);
        } else {
            question.node.classList.remove('answered');
            this.hideNextButton(true);
        }

    };

    /**
     * Does dirtychecking if the question is answered by taking all borm elements (checkboxes and radios) and looking at their `checked` property
     * @param {Object} question - object returned by `getQuestion()`
     * @return {Boolean} - true if is answered
     * */
    this.questionIsAnswered=function(question){
        var isAnswered = false;
        console.log(question);
        if(question && question.node){
            if(question.answers.length>0){
                isAnswered = question.answers.filter(function(answer){
                        var input = typeof answer.for != 'string'? answer.for : document.querySelector(answer.for);
                        return input.checked;
                    }).length>0;
            } else {isAnswered = true}
        }
        console.log(isAnswered);
        return  isAnswered;
    };


    /**
     * Gets question Text in a given `.questionarea` passed as `question`.
     * - `node` - text element.
     * - `text` - text of the element
     * - `id` - id of the element
     * @param {HTMLElement} question - Element `.questionarea`
     * @return {{node: HTMLElement, text:String, id:String}}
     * */
    this.getText=function(question) {
        var el=question.querySelector('.text');
        if(!el){el=question.querySelector('.infotext');}
        return el?{
            node: el,
            text: el.textContent,
            id: el.id
        }:null;
    };

    /**
     * Gets question Instruction in a given `.questionarea` passed as `question`
     * - `node` - instruction element.
     * - `text` - text of the element
     * - `id` - id of the element
     * @param {HTMLElement} question - Element `.questionarea`
     * @return {{node: HTMLElement, text:String, id:String}}
     * */
    this.getInstruction=function(question) {
        var el=question.querySelector('.instruction');
        if(!el){el=question.querySelector('.info_instruction');}
        return el?{
            node: el,
            text: el.textContent,
            id: el.id
        }:null;
    };


    /**
     * Gets question Text in a given `.questionarea` passed as `question`
     * - `node` - `<label>` element.
     * - `text` - text of the element
     * - `id` - id of the element
     * - `for` - `<input id="$for">` input element that `label`'s attribute `for` references
     * @param {HTMLElement} question - Element `.questionarea`
     * @return {[{node: HTMLElement, text:String, id:String, for: HTMLElement}]}
     * */
    this.getAnswerList=function(question){
        return [].slice.call(question.querySelectorAll('.answerlabel>label')).map(function(item){
            return {
                node: item,
                text: item.textContent,
                id: item.id,
                for: '#'+item.getAttribute('for')
            }
        });
    };

    this._currentQuestion = null;

    /**
     * Gets the whole model of the question
     * @param {HTMLElement} element - if necessary to get the certain `.questionarea`, pass it as a reference to its instance
     * @return {{node: HTMLElement, text: String, instruction: Object, answers: Array}}
     * */
    this.getQuestion=function(element){
        var question = element || document.querySelector('.questionarea:not(.answered):not(.excluded)');
        return question?{
            node: question,
            text: this.getText(question),
            instruction: this.getInstruction(question),
            answers: this.getAnswerList(question)
        }:null;
    };

    /**
     * Removes any childnodes from the `HOST` element to prepare it for the next insertion
     * @param {HTMLElement} host - element that needs cleaning
     * */
    this.cleanupHost=function(host){
        if(host.children.length>0){
            var cl = host.children.length;
            while(cl--){
                host.children[cl].removeEventListener('click',this.reflectClick);
                host.removeChild(host.children[cl]);
            }
        }
    };

    /**
     * Gets an instance of a navigation button
     * @param {String} selector - CSS selector of the button
     * @return {{node: HTMLElement, text: String}}
     * */
    this.getNavButton = function(selector){
        var button = this.querySelector(selector);
        return button?{
            node: button,
            text: button.value
        }:null;
    };

    /**
     * Gets a computed `attribute` of an element (bound as `this`) and sets its `property` to a `value`
     * @param {HTMLElement} element - HTML element of `a-instance`
     * @param {String} attribute - attribute on an element
     * @param {String} property - property in attribute
     * @param {?String} value - value for property
     * */
    function setPropertyInAttribute(element,attribute,property,value){
        var attr = element.getAttribute(attribute);
        attr[property]=value;
        element.setAttribute(attribute,attr);
    }

    /**
     * Hides and shows navigational buttons based on the number of questions.
     * */
    function getNavigationButtonsAvailability(){
        var index = QUESTIONS.indexOf(this._currentQuestion.node),
            prev = document.querySelector('#aPrev'),
            next = document.querySelector('#aNext');
            if(prev)prev.setAttribute('visible',index>0?'true':'false');
            if(next)next.setAttribute('visible',QUESTIONS_LENGTH!=1?'true':'false');
    }

    /**
     * Cleans up the hosts (text and answers) and creates entities to be stamped into those.
     * @param {{node: HTMLElement, text: Object, instruction: Object, answers: Array}} question - a question object generated by `getQuestion(element)` function
     * */
    this.stampQuestion=function(question){
        this.cleanupHost(TEXT);
        this.cleanupHost(ANSWERS);
        this._currentQuestion = question; //sets to the current question object
        getNavigationButtonsAvailability.call(this); // sets buttons visible/invisible based on question position
        this.timerStart(); // starts the timer of the time spent on the question

        //creating text
        if(question.text){
            this.createEntity(question.text, TEXT,{
                geometry:'primitive:plane;width:10;height:3;',
                position:{x:0, y: text_vp(question.answers.length),z:0.01},
                material:'shader:html;target:#'+question.text.id+';transparent:true;ratio:width;fps:0;'
            });
        }

        //creating instruction
        if(question.instruction){
            this.createEntity(question.instruction, TEXT,{
                geometry:'primitive:plane;width:10;height:2;',
                position:{x:0, y:instruction_vp(question.answers.length),z:0.01},
                color:'#CCC',
                material:'shader:html;target:#'+question.instruction.id+';transparent:true;ratio:width;fps:0;'
            });
        }

        //creating answers
        if(question.answers && question.answers.length>0){
            // we want to make all questions mandatory and check if they are answered before providing navigation forward
            if(!this.questionIsAnswered(question)){
                this.hideNextButton(true);
            }
            question.answers.forEach(function(answer,index){
                this.createEntity(answer, ANSWERS,{
                    id:'label_'+answer.id,
                    geometry:'primitive:plane;width:10;height:0.9',
                    position:{x:0,y:vp(index,question.answers.length),z: 0.01},
                    material:'shader:html;target:label#'+answer.id+';transparent:true;ratio:width;fps:0',
                    clickable:reflectClick,
                    animated:true
                });
            }.bind(this));
        }
    };

    /**
     * Toggles visibility of the `Next` button based on the `bool` value
     * @param {Boolean} bool - true=hidden
     * */
    this.hideNextButton=function(bool){
        var next = document.querySelector('#aNext');
        if(next)next.setAttribute('visible',(!bool).toString());
    };

    /**
     * Creates an `a-entity` element and applies attributes to it.
     * @param {HTMLElement} obj - model containing info about the element whose snapshot is going to be taken
     * @param {HTMLElement} target - element where this `a-entity` is going to be appended to
     * @param {Object} params - parameters that will be applied as attributes to `a-entity`
     * */
    this.createEntity=function(obj, target, params){
        var entity;

        if(obj){
            var el= obj.node;
            // absolute positioning for html2canvas to take correct snapshot of `el`
            el.style.position="absolute";
            el.style.left=0;
            el.style.top=0;
        }

        // creates `a-entity` by default, though an optional `params.entity` may be passed
        if(params && !params.entity){
            entity = document.createElement('a-entity');
        } else if(params && params.entity){
            entity = document.createElement(params.entity);
            delete params.entity;
        }


        //clickable are only labels so they are assumed to have `for` in the object
        if(params.clickable){
            entity.model = obj;
            entity.addEventListener('click', params.clickable.bind(this));
            delete params.clickable;

            if(params.animated){
                //create `select` animation only for answers so far
                this.createEntity(
                    null,
                    entity,
                    {
                        entity: 'a-animation',
                        begin:'select',
                        fill:'forwards',
                        direction:'normal',
                        attribute:'position',
                        from:[params.position.x, params.position.y, params.position.z].join(' '),
                        to:[params.position.x, params.position.y,TOGGLE_DISTANCE].join(' ')
                    }
                );

                //create `deselect` animation
                this.createEntity(
                    null,
                    entity,
                    {
                        entity: 'a-animation',
                        begin:'deselect',
                        fill:'forwards',
                        direction:'reverse',
                        attribute:'position',
                        from:[params.position.x, params.position.y, params.position.z].join(' '),
                        to:[params.position.x, params.position.y,TOGGLE_DISTANCE].join(' ')
                    }
                );
            delete params.animated;
            }
        }


        //apply params as attributes
        if(typeof params=='object') {
            var param;
            for (param in params) {
                entity.setAttribute(param, param != 'position'?params[param]:[params.position.x, params.position.y, isChecked(obj,params.position.z)].join(' '));
            }
        }



        //append node to target/scene if target is null
        target?target.appendChild(entity):scene.appendChild(entity);

        if(obj){
            //null positioning
            window.setTimeout(function(){
                el.style.position="relative";
                el.style.left='';
                el.style.top='';
            },0);
        }
    };

    /**
     * Checks if the individual option is checked and tweaks it's z-position
     * @param {Object} model - model attached to the node
     * @param {Number} defaultPos - double of the initial position of the element
     * @return {Number} - z-position
     * */
    function isChecked(model,defaultPos){
        if(model && model.for){
            var input = typeof model.for == 'string' ? document.querySelector(model.for) : model.for;
            return input && input.checked? TOGGLE_DISTANCE: defaultPos;
        } else {return defaultPos}
    }

    /**
     * Calculates vertical `y` position of an answer option
     * @param {Number} index - index of the answer option
     * @param {Number} length - total number of answers
     * */
    function vp(index,length){
        var center = length>0? length/2 : 0;
        return center - (++index);
    }
    /**
     * Calculates vertical `y` position of a question text
     * @param {Number} length - total number of answers
     * */
    function text_vp(length){
        var center = length>0?Math.floor(length/2):0;
        return center-1;
    }
    /**
     * Calculates vertical `y` position of an instruction text
     * @param {Number} length - total number of answers
     * */
    function instruction_vp(length){
        var center = length>0? length/2 : 0;
        return center - 4;
    }

    /**
     * Is called on the first click within `reflectClick` for all siblings of the target as a late upgrade from string to element for the `for` key.
     * This is necessary because initial go thought answer options when generating the model picks up wrong type for "other" radio option.
     * */
    function mapFormElements(){
        if(typeof this.model.for == 'string'){
            [].slice.call(this.parentNode.children).forEach(function(el){
                el.model.for = document.querySelector(el.model.for);
            })
        }
        return this.model.for;
    }

    /**
     * Reflects click on an element and sets the question as answered
     * @param {CustomEvent} e - click CustomEvent with `detail.target`
     * */
    function reflectClick(e){
        var entity = e.detail.target,
            formElement = mapFormElements.call(entity); //late upgrade for model of entities

        if(formElement.nodeName.toLowerCase()=='input'){
            switch(formElement.type){
                case 'radio':
                    formElement.checked = true;
                    deselectOthers(entity);
                    toggleCheckedState.call(entity, true);
                    break;
                case 'checkbox':
                    formElement.checked = !formElement.checked;
                    checkForExclusive(entity); // if there's an exclusive option, we need to uncheck it
                    toggleCheckedState.call(entity, formElement.checked);
                    break;
            }
            this.setQuestionAnswered(this._currentQuestion);
        }
    }

    /**
     * checks if the clicked element might be an exclusive choice and other elements need to be unchecked
     * this is done via filtering all siblings not equal to itself and whose model type is different from the clicked one
     * @param {HTMLElement} el - a-entity
     * */
    function checkForExclusive(el){
        var exclusive = [].slice.call(el.parentNode.children).filter(function(node){
            return node!=el && node.model.for.type != el.model.for.type;
        });
        if(exclusive && exclusive.length>0){
            toggleCheckedState.call(exclusive[0], false);
        }
    }

    /**
     * Deselects other items, true for exclusive radio among checkboxes as well as other radios
     * @param {HTMLElement} entity - a-entity
     * */
    function deselectOthers(entity) {
        [].slice.call(entity.parentNode.children).filter(function(node){return node!=entity}).forEach(function(el){
            toggleCheckedState.call(el,false);
        })
    }

    /**
     * Toggles 'checked' state for answer options by taking an option closer to subject by adjusting z position by half a meter.
     * @param {Boolean} check - if `true` will check
     * @event {Event} deselect - event emitted when the option is deselected
     * @event {Event} select - event emitted when the option is selected
     * */
    function toggleCheckedState(check){
        var oPosition = this.getComputedAttribute('position');
        if(!check && oPosition.z==TOGGLE_DISTANCE){ // if need to deselect and was selected
            //this.setAttribute('position', [oPosition.x, oPosition.y, 0].join(' '));
            this.model.for.checked=false;
            this.emit('deselect');
        }
        else if(check && oPosition.z!=TOGGLE_DISTANCE){ // if wasn't selected and needs to be
            //this.setAttribute('position', [oPosition.x, oPosition.y, TOGGLE_DISTANCE].join(' '));
            this.model.for.checked=true;
            this.emit('select');
        }
    }

    /**
     * Arranges layouting elements on an arch
     * @param {{direction:Number, margin:Number, radius:Number}} data - object containing `direction (-1:right| 1:left)` in which positioning elements will take place, `margin` in rad which defines distance between elements and `radius` in meters
     * @param {{x:Number, y:Number, z:Number}} startPosition - initial coordinates of the center point of the circle on which arch elements are placed
     * */
    function layout(data,startPosition){
        var children = [].slice.call(this.children);
        var mLength = children.map(function(elem){return elem.getComputedAttribute('geometry').width});
        var positions = getSeparatedCirclePositions(data, mLength, startPosition);
        setPositions(children, positions);
    }

    /**
     * Function that does calculation of distribution of elements in a circulra fashoin on a semi-circle
     * @param {{direction:Number, margin:Number, radius:Number}} data - object containing `direction (-1:right| 1:left)` in which positioning elements will take place, `margin` in rad which defines distance between elements and `radius` in meters
     * @param {Array} mLength - Array of widths of elements starting with the one on 12 o'clock and going clockwise fo `data.direction ==-1` ar anticlockwise for `data.direction==1`
     * @param {{x:Number, y:Number, z:Number}} startPosition - initial coordinates of the center point of the circle on which arch elements are placed
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
                -startPosition.z - data.radius*Math.sin(w)]);

            w = w+v;

        }

        return positions;

    }
    /**
     * Sets start position as and attribute on an array of elements
     * @param {Array} els - array of elements to set position on
     * @param {Array} positions - array of positions to set to `els`
     * */
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


    /**
     * Reflects click on an element
     * @param {CustomEvent} e - click CustomEvent with `detail.target`
     * */
    function reflectNav(e){
        //console.log(e.detail.target.model);
        var entity = e.detail.target;

        switch(entity.id){
            case 'aPrev':
                navigateToQuestion.call(this,false);
                break;
            case 'aNext':
                navigateToQuestion.call(this,true,entity.model);
                break;
        }
    }

    /**
     * Function that does navigation. Because a survey is single-paged all 'pages' are simulated which places one question per page and navigating between them.
     * @param {Boolean} forward - `true` if forwards, `false` if backwards navigation
     * @param {Object} model - question's model
     * */
    function navigateToQuestion(forward,model){
        var curQuestionNode = this._currentQuestion.node,
            index = QUESTIONS.indexOf(curQuestionNode),
            question;
            this.backgroundChanger(index); //change background sphere of the question
            this.timerEnd(); //capture end time for timing function
        if(forward && index < QUESTIONS_LENGTH-1){ //going forwards
            ++index;
            this.backgroundChanger(index);
            question = this.getQuestion(QUESTIONS[index]);
            if(question)this.stampQuestion(question);
        } else if(!forward && index>0){ //going backwards
            --index;
            this.backgroundChanger(index);
            question = this.getQuestion(QUESTIONS[index]);
            if(question)this.stampQuestion(question);
        } else if(forward && index == QUESTIONS_LENGTH-1 && model){ //last question and form submit
            this.logTime();
            window.setTimeout(function(){model.node.click()},0);
        } else {console.warn('question index '+index+' is out of range')}
    }

    /**
     * Changes the background sphere by changing `src` attribute on the `<a-sky>` element
     * @param {Number} index of the question against which the `model` defined on sky is searched. `model = {{defaultBG:String, backgrounds:Array}}`
     * */
    this.backgroundChanger=function(index){
        var sky=scene.querySelector('a-sky');
        if(sky && sky.model){
            var defaultBG = sky.model.defaultBG;
            var questionBG = sky.model.backgrounds[index];
            var src = questionBG && questionBG.length>0?questionBG:defaultBG;
            sky.setAttribute('src',src);
        }
    };

    /**
     * Starts the timer when a person enters the question _for the first time_
     * */
    this.timerStart=function(){
        var questionIndex = QUESTIONS.indexOf(this._currentQuestion.node);
        if(this._currentQuestion.answers.length>0) {
            if (!this.timer[questionIndex]) {
                this.timer[questionIndex] = {};
                this.timer[questionIndex].start = new Date().getTime();
            }
        }
    };

    /**
     * Stops the timer when a person exits the question _for the first time_
     * */
    this.timerEnd=function(){
        var questionIndex = QUESTIONS.indexOf(this._currentQuestion.node);
        if(this._currentQuestion.answers.length>0) {
            if (!this.timer[questionIndex].end){
                this.timer[questionIndex].end = new Date().getTime();
                this.timer[questionIndex].time = ((this.timer[questionIndex].end - this.timer[questionIndex].start)/1000).toFixed(0);
            }
        }
    };

    /**
     * Sets the time spent on one question in seconds based on the `start` and `end` times. It sets a comma-separated string of values to the `value` of an open-text (single-line) question named with id `#excluded_timetracking`
     * */
    this.logTime=function(){
        var timetracking = document.querySelector('#excluded_timetracking');
        if(timetracking && this.timer.length>0){
            timetracking.value = this.timer.filter(function(timer){return timer.time && !isNaN(timer.time)}).map(function(timer){return timer.time}).join(',');
        }
    };

    /**
     * Stamps the first `.questionarea` that doesn't have `.answered` into a-scene and initialize navigation
     * */
    this.init=function(){

        //initialize nav buttons on left and right sides of question text and answer text
        /*
        this.createEntity(
            this.getNavButton.call(document,'#backbutton'),
            HOST.querySelector('.leftCircle'),
            {
                id:'aPrev',
                geometry:"primitive:plane; width:1; height:1;",
                'look-at':"#camera",
                scale:"2 2 2",
                material:'shader:html;target:.prev;transparent:true;ratio:width;fps:0;',
                clickable:reflectNav
            }
        );
        this.createEntity(
            this.getNavButton.call(document,'#forwardbutton'),
            HOST.querySelector('.rightCircle'),
            {
                id:'aNext',
                geometry:"primitive:plane; width:1; height:1;",
                'look-at':"#camera",
                scale:"2 2 2",
                material:'shader:html;target:.next;transparent:true;ratio:width;fps:0;',
                clickable:reflectNav
            }
        );
        */
      //initialize nav buttons under the question text close to the subject
        this.createEntity(
            this.getNavButton.call(document,'#backbutton'),
            null,
            {
                id:'aPrev',
                geometry:"primitive:plane; width:0.3; height:0.3;",
                'look-at':"#camera",
                scale:"1 1 1",
                position: {x:-0.4, y:1, z:2.9},
                material:'shader:html;target:.prev;transparent:true;ratio:width;fps:0;',
                clickable:reflectNav
            }
        );
        this.createEntity(
            this.getNavButton.call(document,'#forwardbutton'),
            null,
            {
                id:'aNext',
                geometry:"primitive:plane; width:0.3; height:0.3;",
                'look-at':"#camera",
                position: {x:0.4, y:1, z:2.9},
                scale:"1 1 1",
                material:'shader:html;target:.next;transparent:true;ratio:width;fps:0;',
                clickable:reflectNav
            }
        );
        /*
        //initialize nav buttons above the question text close to the subject
        this.createEntity(
            this.getNavButton.call(document,'#backbutton'),
            null,
            {
                id:'aPrev',
                geometry:"primitive:plane; width:0.3; height:0.3;",
                'look-at':"#camera",
                scale:"1 1 1",
                position: {x:-0.4, y:2.3, z:2.9},
                material:'shader:html;target:.prev;transparent:true;ratio:width;fps:0;',
                clickable:reflectNav
            }
        );
        this.createEntity(
            this.getNavButton.call(document,'#forwardbutton'),
            null,
            {
                id:'aNext',
                geometry:"primitive:plane; width:0.3; height:0.3;",
                'look-at':"#camera",
                position: {x:0.4, y:2.3, z:2.9},
                scale:"1 1 1",
                material:'shader:html;target:.next;transparent:true;ratio:width;fps:0;',
                clickable:reflectNav
            }
        );
        */

        //initialize first question
        var question = this.getQuestion();
        if(question)this.stampQuestion(question);

        //initialize arch layout
        window.setTimeout(function(){
            var startPosition = HOST.getComputedAttribute('position');
            layout.call(scene.querySelector('.leftCircle'), {radius:8, margin:0.2, direction:1}, startPosition);
            layout.call(scene.querySelector('.rightCircle'), {radius:8, margin:0.2, direction:-1}, startPosition);
        },100);

        // hack for thank you finish page to enter VR mode and display info text
        if(QUESTIONS_LENGTH==1 && this._currentQuestion && this._currentQuestion.answers.length==0){scene.enterVR();}
    };

    this.init();

}

