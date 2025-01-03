// exhaustiveness

type Op = 'add' | 'multiply' | 'divide';

const run = (op: Op) => (a: number, b: number)/*: number*/ => {
  switch (op) {
    case 'add':
      return a + b;
    case 'multiply':
      return a * b;
    // default: {
    //   // helper function for this is commonly called "absurd"
    //   const _: never = op;
    //   // also, defensively, because Javascript:
    //   throw new Error(`panic! "${op}" is not a valid operation`);
    // }
  }
};

const n = run('add')(1, 1);

// if types are solid enough down the line, the error is actually caught
const use = (n: number): void => {};

// @ts-expect-error
use(n);

const run2 = (op: Op) => (a: number, b: number): void => {
  switch (op) {
    case 'add':
      console.log(a + b);
      // writeToDb(a + b);
      break;
    case 'multiply':
      console.log(a * b);
      // writeToDb(a * b);
      break;
    // here, without it, exhaustiveness is lost
    // default:
    //   const _: never = op;
  }
};

type LogAction = { action: 'log'; value: string };
const LogAction = (a: string): LogAction => ({ action: 'log', value: a });

// we rarely truly want a side effect - we're just a bit lazy and run side effects right away
const run3 = (op: Op) => (a: number, b: number) => {
  switch (op) {
    case 'add':
      return LogAction(`${a} + ${b} = ${a + b}`);
    case 'multiply':
      return LogAction(`${a} * ${b} = ${a * b}`);
    // we're safe again
    // default:
    //   const _: never = op;
  }
};

const action = run3('add')(1, 1);

const runAction = (action: LogAction) => {
  /*well, we'll want exhaustiveness here or eventually somewhere down the line!*/
  switch (action.action) {
    case 'log':
      console.log(action.value);
      break;
    default:
      const _: never = action.action;
  }
};

// action being "undefined" is caught here, but we'll now want exhaustiveness in runAction
// @ts-expect-error
runAction(action);

// run3('add')(1, 1) is possible, no one stops us (except certain eslint rules)

// but if we want side effects very much and want to avoid command pattern, we can return an effect
const run4 = (op: Op) => (a: number, b: number) => {
  switch (op) {
    case 'add':
      return () => console.log(a + b);
    case 'multiply':
      return () => console.log(a + b);
    // default: etc...
  }
};

const action2 = run4('add')(1, 1);

// lack of exhaustiveness is caught here
// @ts-expect-error
action2();

// the flow becomes: (Op + args)  => (Effect) => void
// or just define goddamn return types / use absurds

// bonus - partial exhaustiveness

type OpPartial = 'add' | 'multiply' | 'divide' | (string & {});

const run5 = (op: OpPartial) => (a: number, b: number) => {
  switch (op) {
    case 'add':
      return LogAction(`${a} + ${b} = ${a + b}`);
    case 'multiply':
      return LogAction(`${a} * ${b} = ${a * b}`);
    case 'divide':
      return LogAction(`${a} / ${b} = ${a / b}`);
    default:
      return LogAction('default');
  }
};

// matching - NEXT SLIDE

// OOP style:
interface Animal {
  makeSound(): string;
}

class Animal implements Animal {
  constructor(public name: string) {}
  makeSound(): string {
    return `${this.name} makes a sound.`;
  }
}

class Dog extends Animal {
  name = 'Dog';
  makeSound(): string {
    return `${this.name} barks.`;
  }
}

class Cat extends Animal {
  name = 'Cat';
  makeSound(): string {
    return `${this.name} meows.`;
  }
}

const handleSound = (animal: Animal): string => animal.makeSound();

const dog = new Dog('Storm');
const cat = new Cat('Viper');

// "Storm barks."
handleSound(dog);
// "Viper meows."
handleSound(cat);

// mapping style:

type Notification =
  { type: 'email', recipient: string, subject: string, body: string } |
  { type: 'sms', phoneNumber: string, message: string };

declare function sendEmail(recipient: string, subject: string, body: string): void;
declare function sendSMS(phoneNumber: string, message: string): void;

const handlers = {
  email: (notification: Notification & {type: 'email'}) => sendEmail(notification.recipient, notification.subject, notification.body),
  sms: (notification: Notification & {type: 'sms'}) => sendSMS(notification.phoneNumber, notification.message),
};

const notification: Notification = {type: 'email', recipient: 'igor@loskutoff.com', subject: 'hello', body: 'world'};

// or define like this:
// const notification = {type: 'email', recipient: 'igor@loskutoff.com', subject: 'hello', body: 'world'} as const;

handlers[notification.type](notification);

// ts figures out the narrowed type of notification:
// @ts-expect-error
handlers['sms'](notification);

// switchcase style:

const switchNotification = (notification: Notification) => {
  switch (notification.type) {

    // notification.type = 'email' | 'sms' | never;

    case 'email':
      sendEmail(notification.recipient, notification.subject, notification.body);
      break;

    // notification.type = 'sms' | never;

    case 'sms':
      sendSMS(notification.phoneNumber, notification.message);
      break;

    // notification.type = never;

    default:
      const _: never = notification;
      throw new Error(`panic! Unknown notification type: ${(notification as any).type}`);
  }
}

// Notification is a union discriminated by the "type" field!

// more fields? complex logic? next slide