// exhaustiveness

type Op = 'add' | 'multiply' | 'divide';

const run = (op: Op) => (a: number, b: number)/*: number*/ => {
  switch (op) {
    case 'add':
      return a + b;
    case 'multiply':
      return a * b;
    // I'd usually do this, but is it really necessary?
    // default: {
    //   // helper function for this is commonly called "absurd"
    //   const _: never = op;
    // also, defensively, because Javascript:
    //   throw new Error(`panic! "${op}" is not a valid operation`);
    // }
  }
};

const n = run('add')(1, 1);

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
      console.log(a + b);
      // writeToDb(a + b);
      break;
    // here, without it, exhaustiveness goes to trash
    // default:
    //   const _: never = op;
  }
};

// we actually rarely want a side effect
const run3 = (op: Op) => (a: number, b: number) => {
  switch (op) {
    case 'add':
      return { action: 'log', value: a + b };
    case 'multiply':
      return { action: 'log', value: a + b };
    // we're safe again
    // default:
    //   const _: never = op;
  }
};

const runAction = (action: {action: 'log'; value: number}) => {
  /*well, we'll want exhaustiveness here or eventually somewhere down the line!*/
  switch (action.action) {
    case 'log':
      console.log(action.value);
      break;
    default:
      const _: never = action.action;
  }
};

const action = run3('add')(1, 1);

// again, we're safe - action being "undefined" is caught here
// @ts-expect-error
runAction(action);

// but if we want side effects very very much
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

// matching - next slide

// OOP style:
class Animal {
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
}

const notification: Notification = {type: 'email', recipient: 'igor@loskutoff.com', subject: 'hello', body: 'world'};
handlers[notification.type](notification);

// ts figures out the narrowed type of notification:
// @ts-expect-error
handlers['sms'](notification);

// switchcase style:

const switchNotification = (notification: Notification) => {
  switch (notification.type) {
    case 'email':
      // NB! better to return a command here, it's much more composable
      sendEmail(notification.recipient, notification.subject, notification.body);
      break;
    case 'sms':
      sendSMS(notification.phoneNumber, notification.message);
      break;
    default:
      const _: never = notification;
      throw new Error(`panic! Unknown notification type: ${(notification as any).type}`);
  }
}

// Notification is a union discriminated by the "type" field!

