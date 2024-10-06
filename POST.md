# Mindfulness in Typescript code branching. Exhaustiveness, pattern matching, and side effects. 1/2: "Absurdity applied"

> This is the first post in a couple of posts about code branching in TypeScript. 
> The first post serves as an introduction to the topic and supposed to be entry-level. It shows useful techniques of how to improve branching safety with explicit exhaustiveness checks.

Most of us developers have written their first **if/else** statement when we were just newborns (that is, 0-years-experienced newborns in the industry).

```ts
if (x > 5) {
  console.log('Greater than 5');
} else {
  console.log('Not greater than 5');
}
```

We proceeded with learning switch/case, and usually end here. We're ready to hack The Next Facebook ™. Nobody can stop us now, not even our PM. Or even SIGTERM. Ok, the last one was a bit dark.

```ts
switch (x) {
  case 5:
    console.log('Five');
    break;
  case 6:
    console.log('Six');
    break;
  default:
    console.log('Not five or six');
}
```

Then we learn about OO and inheritance, and that it also can provide kind of branching:

```ts
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

// see, no if/else or anything
const handleSound = (animal: Animal): string => animal.makeSound();

const dog = new Dog('Storm');
const cat = new Cat('Viper');

// "Storm barks."
handleSound(dog);
// "Viper meows."
handleSound(cat);

```

> We can also invert the control of the above using visitor pattern (https://en.wikipedia.org/wiki/Visitor_pattern) which I'm conveniently omitting from the post. 

The most inquisitive of us probably wondered how we can do more complex branching and encountered pattern matching in such languages as Haskell, Scala, OCaml and Rust:

```scala
def listMatch(lst: List[Int]): String = lst match {
  case Nil => "Empty list"
  case List(0, _, _) => "Starts with zero and has three elements"
  case List(x, y) if x == y => "Two identical elements"
  case _ => "Other"
}
```

But is there a deeper meaning to those methods? And are there intricacies to them that we should be aware about?

Here, I'll hopefully present a way of deeper thinking about code branching. I'll show how to improve type safety and composability of branching in TypeScript.

## Why branch?

We need if/else or equivalents to do anything useful. 
Without it, your program will be quite static! 
Not much decision making will be possible. 
Probably, you'll map/reduce some data into some other data and that's it.
Not that mapping data wasn't a big feat. It's just not always enough by itself.

Assume that you want to send a notification to a user. A user may use different channels to receive notifications, and you want to dispatch properly: emails to email APIs such as Sendgrid, Slack to Slack APIs etc. 

```ts
type Notification =
  | { type: 'email'; recipient: string; subject: string; body: string }
  | { type: 'sms'; phoneNumber: string; message: string }
  | { type: 'push'; deviceId: string; title: string; body: string }
  | { type: 'slack'; channelId: string; text: string }
```

You can handle it with a naive switch/case:

```ts
function handleNotification(notification: Notification) {
  switch (notification.type) {
    case 'email':
      sendEmail(notification.recipient, notification.subject, notification.body);
      break;
    case 'sms':
      sendSMS(notification.phoneNumber, notification.message);
      break;
    case 'push':
      sendPushNotification(notification.deviceId, notification.title, notification.body);
      break;
    case 'slack':
      postToSlack(notification.channelId, notification.text);
      break;
  }
}
```

> This code has some potential issues I'll talk about later. The main point here is that it shows why we want to branch our code at all.
 
By this point, I think it's clear enough that we can't do much without branching: notification dispatching, data mapping, fibonacci sequence, FizzBuzz, interview questions: all of those definitely important tasks require some form or if/else.
 
### Playing around with if/else

You also can rewrite the code above to if/else. That won't change much, it's just a bit more boilerplate in this case. 

> if/else is much more powerful since you can give it any expression resulting in a boolean, e.g. `if (x > 5)`, whereas switch/case would only accept exact matches.

![if/else and switch? Same Picture!](https://www.loskutoff.com/static/blog/never-have-i-ever-1/same-picture.jpeg)
> Picture source: https://dev.to/sumusiriwardana/if-else-or-switch-case-which-one-to-pick-4p3h

```ts
function handleNotification(notification: Notification) {
  if (notification.type === 'email') {
    sendEmail(notification.recipient, notification.subject, notification.body);
  } else if (notification.type === 'sms') {
    sendSMS(notification.phoneNumber, notification.message);
  } else if (notification.type === 'push') {
    sendPushNotification(notification.deviceId, notification.title, notification.body);
  } else if (notification.type === 'slack') {
    postToSlack(notification.channelId, notification.text);
  }
}
```

In both cases, TypeScript figures out the shape of the notification object after the "type" field check. You also won't be able to write something like `notification.type === 'GIBBERISH'` or `case('yes?')`; it'll stop you.

A difference with switch/case is that it's much more boilerplate, but if/else is more applicable to more general cases.

## Adding new cases

Now, time for the bad news. We want to add a new case like `{ type: 'discord'; channel: string; message: string }`. We add it to the union type definition but forget to add to `handleNotification` function.

`handleNotification` works for a week until we notice users don't get notified. They lost their money, business went down, marriage broke up. All of it because we forgot to handle `type === 'discord'`. 

This is a classic problem. Fortunately, there's a solution already.

```ts
function absurd(x: never): never {
  throw new Error(`panic! not reachable: ${x}`);
}

function handleNotification(notification: Notification) {
  switch (notification.type) {
    // ... switch/case from handleNotification above and then ...
    default:
      absurd(notification.type);
  }
}
```

How it works? Each `case` (or `if/else`) TypeScript narrows down the possible type of `notification.type`:

```ts
// here, notification.type is full 'email' | 'sms' | 'push' | 'slack' | 'discord'
switch (notification.type) {
  case 'email':
    break;
  // if we end with "default" clause here, notification.type would be 'sms' | 'push' | 'slack' | 'discord', so, with no 'email'
  case 'sms':
    break;
  // if we end with "default" clause here, notification.type would be 'push' | 'slack' | 'discord', so, with no 'email' or 'sms'
  case 'push':
    break;
  // if we end with "default" clause here, notification.type would be 'slack' | 'discord', so, with no 'email' or 'sms' or 'push'
  case 'slack':
    postToSlack(notification.channelId, notification.text);
    break;
  // finally, we're ending with "default" clause here, and so notification.type is 'discord', with no 'email' or 'sms' or 'push' or 'slack'
  default:
    absurd(notification.type);
}
```

But at `absurd(notification.type)` expects `never` type! It won't allow anything else, but we're trying to feed it 'discord' string literal.
And so it goes: compiler complaints, you realize your code has a bug, you fix it **before** shipping to your user and not **after** (that is, unless you also wrote good tests.)

You fix it by adding another `case` clause:

```ts
function handleNotification(notification: Notification) {
  switch (notification.type) {
    // ...
    case 'discord':
      postToDiscord(notification.channelId, notification.message);
      break;
    // default: ...
  }
}
```

> What about more "type-free" comparisons like n > 5? Type narrowing doesn't apply here. You have to figure yourself whether you covered all cases or not.

### A peculiar case of "never"

> Quoth the Raven “Nevermore.”

`never` is a very [special type](https://www.typescriptlang.org/docs/handbook/basic-types.html#never) in TypeScript. 

It's assignable to anything, which isn't very useful in our case, but is useful in more advanced cases. 

But another property we can and do leverage: nothing can be assigned to `never`, except `never` itself.

So, the function `absurd` expects only `never` type. 

```ts
function absurd(x: never): never {
  throw new Error(`panic! not reachable: ${x}`);
}
absurd('fizzbuzz'); // error: Argument of type '"fizzbuzz"' is not assignable to parameter of type 'never'.
```

When our `notification.type` above is being checked, it narrows down gradually to lesser and lesser type, until only `discord` literal is left, and finally we narrow `discord` literal itself. 

When nothing is left out of our poor `notification.type` type, only `never` remains. 

There's one extra way to show that in code; with an (arguably ugly) ternary:

```ts
// some imaginary numeric "code"...
const code: number = 
  notification.type/*'email' | 'sms' | 'push' | 'slack' | 'discord'*/ === 'email' ? 1 :
  notification.type/*'sms' | 'push' | 'slack' | 'discord'*/ === 'sms' ? 2 : 
  notification.type/*'push' | 'slack' | 'discord'*/ === 'push' ? 3 : 
  notification.type/*'slack' | 'discord'*/ === 'slack' ? 4 : 
  notification.type/*'discord'*/ === 'discord' ? 5 : 
  absurd(notification.type/*never*/);
````

Importantly, when `never`-typed values in code, you can always assume this part of the code is unreachable, that is, if your typing has no bugs. In TypeScript, it may happen e.g. because of casting with `as`. That's why I accompany the `never` check in `absurd` with a `throw`. Better safe than sorry.

### Object key mapping

There's another technique to map behaviours that's worth mentioning. It lets us, in some cases, avoid the need for `switch/case`, `if/else`, and still have exhaustive behaviour without using any `absurd` hacks.

```ts
export const handlers = {
  email: (notification: Notification & {type: 'email'}) => sendEmail(notification.recipient, notification.subject, notification.body),
  sms: (notification: Notification & {type: 'sms'}) => sendSMS(notification.phoneNumber, notification.message),
  push: (notification: Notification & {type: 'push'}) => sendPushNotification(notification.deviceId, notification.title, notification.body),
  slack: (notification: Notification & {type: 'slack'}) => postToSlack(notification.channelId, notification.text),
  discord: (notification: Notification & {type: 'discord'}) => postToDiscord(notification.channelId, notification.message),
};
// ...
const notification: Notification = {type: 'email', recipient: 'igor@loskutoff.com', subject: 'hello', body: 'world'};
handlers[notification.type](notification);
```

Note `& {type: 'email'}` in the argument type. It would narrow down the type of `notification`, opening up the fields `receipient`, `subject` and `body` to be used in the handler.
Same with `sms` and `push` and `slack` and `discord`.

With `handlers`, you won't be able to write a new type of notifications without adding a new handler, which is the main benefit of this technique.

Dead code elimination works here as well: if you remove one of the handlers, its `& {type: }` won't compile anymore, inviting you to remove the corresponding case as well, same as with `switch/case` or `if/else`.

I currently see certain disdain for this technique in the community lately. The main argument is that it introduces a level of indirection.
Although I'm sure this wariness has some grounding, I personally don't care about these accusations and use the technique whenever I see fit.
You can take it or leave it, because there's a plenty of other ways to achieve the same goal.

## Never have I ever...

In this short post, I've introduced the concept of exhaustiveness checking and explored some of the ways to branch in TypeScript.

These tools alone, used wisely, will radically improve your type safety and save you from many runtime bugs.

In the next post, I'll talk about more advanced notions, such as pattern matching with ts-pattern and in other languages, expressions and side effects, IIFE, discriminated unions and algebraic data types (spoiler: we used the latter two in the examples above), and what they do in OOP to achieve the same goal (spoiler: Visitor pattern).

I'll also present a case that in most situations, we don't need the `absurd`-like function call at all, even if you don't explicitly declare return type.

