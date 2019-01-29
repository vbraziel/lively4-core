import { expect } from 'src/external/chai.js';
import Stroboscope from 'src/client/stroboscope/stroboscope.js';
import { EventType } from 'src/client/stroboscope/eventtype.js';

class EventReciever {
  constructor() {
    this.events = []
  }

  onEvents(events) {
    console.log(events)
    if (events.length > 0) {
      console.log(events)
      this.events.push.apply(this.events, events)
    }
  }
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

describe('stroboscope create events', () => {
  it('events for undefined', () => {
    var target = undefined
    var stroboscope = new Stroboscope(target)

    expect(stroboscope.scan()).to.deep.equal([]);
  });

  it('event for create property', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = 42;
    var events = stroboscope.scan();
    expect(events.length).to.equal(1);

    var create_event = events[0]
    expect(create_event.event_type).to.equal(EventType.create);
    expect(create_event.property).to.equal("solution");
    expect(create_event.value).to.equal(42);
    expect(create_event.property_type).to.equal("number");
  });

  it('event for delete property', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = 42;
    stroboscope.scan();

    delete target.solution;

    var events = stroboscope.scan()
    expect(events.length).to.equal(1);
    var delete_event = events[0]
    expect(delete_event.event_type).to.equal(EventType.delete);
    expect(delete_event.property).to.equal("solution");
    expect(delete_event.value).to.equal(undefined);
    expect(delete_event.property_type).to.equal(undefined);
  });

  it('event for change property', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = 42;
    var events1 = stroboscope.scan();
    expect(events1.length).to.equal(1);

    target.solution = 21;

    var events2 = stroboscope.scan();
    expect(events2.length).to.equal(1);

    var create_event = events2[0]
    expect(create_event.event_type).to.equal(EventType.change);
    expect(create_event.property).to.equal("solution");
    expect(create_event.value).to.equal(21);
    expect(create_event.property_type).to.equal("number");
  });

  it('no event for already seen property', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = 42;
    var events = stroboscope.scan();
    expect(events.length).to.equal(1);

    events = stroboscope.scan();
    expect(events.length).to.equal(0);
  });

  it('event for property type number', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = 42;
    var events = stroboscope.scan();
    var event = events[0]
    expect(event.property_type).to.equal("number");
  });

  it('event for property type string', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = "What's the question?";
    var events = stroboscope.scan();
    var event = events[0]
    expect(event.property_type).to.equal("string");
  });

  it('event for property type boolean', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = true;
    var events = stroboscope.scan();
    var event = events[0]
    expect(event.property_type).to.equal("boolean");
  });

  it('event for property type null', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = null;
    var events = stroboscope.scan();
    var event = events[0]
    expect(event.property_type).to.equal("object");
  });

  it('event for property type undefined', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = undefined;
    var events = stroboscope.scan();
    var event = events[0]
    expect(event.property_type).to.equal("undefined");
  });

  it('event for property type symbol', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = Symbol("id");
    var events = stroboscope.scan();
    var event = events[0]
    expect(event.property_type).to.equal("symbol");
  });

  it('event for property type function', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = function() {};
    var events = stroboscope.scan();
    var event = events[0]
    expect(event.property_type).to.equal("function");
  });

  it('event for property type object', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = {};
    var events = stroboscope.scan();
    var event = events[0]
    expect(event.property_type).to.equal("object");
  });

  it('events for multiple property changes', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.question = "What's the answer?"
    target.solution = 42;
    var events = stroboscope.scan();

    expect(events.length).to.equal(2);
  });

  it('events for complex property changes', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = 41;
    target.review = 2
    target.member = {}
    target.name = "Mario"

    stroboscope.scan();

    delete target.solution;
    target.review = 3
    target.use = function() {}

    var events = stroboscope.scan()
    expect(events.length).to.equal(3);
  });

  it('event trigger is stroboscope', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    target.solution = 42;
    var events = stroboscope.scan();
    expect(events[0].trigger).to.equal("Stroboscope");
  });
})

describe('stroboscope scanning logic', () => {
  it('reciever is not defined', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    var events = stroboscope.scan();

    expect(events).to.deep.equal([]);
  });

  it('reciever is defined', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);
    var reciever = new EventReciever()
    stroboscope.reciever = reciever

    target.solution = 42;

    var events = stroboscope.scan();

    expect(reciever.events).to.deep.equal(events);
  });

  it('is running status', () => {
    var target = {}
    var stroboscope = new Stroboscope(target);

    expect(stroboscope.is_running()).to.equal(false)
    stroboscope.start()

    expect(stroboscope.is_running()).to.equal(true)

    stroboscope.stop()
    expect(stroboscope.is_running()).to.equal(false)
  });

  it('events on targets property changes', () => {
    //The Testrunner seems to have problems with the async await feature of js
    
    var target = {}
    var stroboscope = new Stroboscope(target);
    var reciever = new EventReciever()
    stroboscope.reciever = reciever

    stroboscope.start()  
    sleep(100)

    target.solution = 42;

    sleep(100)
    stroboscope.stop()
    expect(reciever.events.length).to.equal(1);
    expect(reciever.events[0].event_type).to.equal(EventType.create);
  });
})

describe('stroboscope object id generation', () => {

  it('object id for undefined', () => {
    var stroboscope = new Stroboscope(undefined)
    expect(stroboscope._object_uuid).to.equal(undefined);
  });

  it('obejct id for an object', () => {
    var a = {}

    var stroboscope = new Stroboscope(a)
    expect(stroboscope._object_uuid).to.not.equal(undefined);
  });

  it('object id after target change', () => {
    var a = {}
    var b = {}
    
    var stroboscope = new Stroboscope(a)
    var uuid1 = stroboscope._object_uuid
    
    stroboscope.change_target(b)

    expect(stroboscope._object_uuid).to.not.equal(uuid1);
  });
})