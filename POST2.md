# Functional programming in TypeScript: mindfulness in code branching. Pattern matching, exhaustiveness, and side effects. 2/2

In the [first post](https://www.loskutoff.com/never-have-i-ever-1/), I've introduced the concept of exhaustiveness checking and explored some of the ways to branch in TypeScript.

Here, I'd like to explore the topic a bit more: I'll talk about why TypeScript if/else and switch/case lacking and of the ways to improve it.

You'll see what's "functional" about the way of handling if/else the way I'll propose.

We'll talk about if/else statement vs expressions, and through this naturally cycle back to the topic of exhaustiveness checking from the previous post.

I'll also present the case that the "absurd" technique from the first post is not needed in most situations, and that if we go full-functional, not needed at all (although you probably don't want to go full-functional).

## Statements vs expressions

Let's take a look at the if/else in Rust:

```rust
let result = if condition { value1 } else { value2 };
```

If/else can produce a value, that can be assigned to a variable, passed to a function, or returned from a function. 

Having a value returned from a conditional expression makes the code more expressive, its intent clearer. 
Not unlike with functions: compare a function that reassigns a variable somewhere in the outer scope, with a function that returns a value.

```typescript
let result: null | number = null;
function reassign() {
  result = 1;
}

function returning(): number {
  return 2;
}
```

To find out what "reassign" does, you have to read its code. 
To find out what "returning" does though, or at least to have a clue on its intent, you only need to glance at its declaration: `function returning(): number`.
The `function reassign()` changes "something somewhere", whereas the `function returning(): number` gives a result that you're free to use further immediately.
The function `returning` is an example of a pure function: it depends only on its input (which is nothing in this case) and produces a result, not changing anything else outside of its scope.
In practice (and very likely in theory too) you can do much more useful things with pure functions than with their impure counterparts.
Pure functions are predictable and easier to test, always producing the same output for given inputs. They avoid side effects, enhancing code reliability and maintainability.

Now, if you squint hard enough, you might notice that the code

```rust
let result = if condition { value1 } else { value2 };
```

has all the prerequisites of a pure function: it depends on condition, value1 and value2 and produces a result.

Many other languages, such as OCaml, Haskell, and Scala, have similar semantics to if/else.

Many others though, such as C++, Java, and Javascript/Typescript, can't produce a value from an if/else. 
In this case, if/else is called a **statement**: **a syntactic unit that performs an action**.

This Javascript code won't work:
```javascript
const result = if (x > 0) { return 1 } else { return 2 };
```

But this one will:
```javascript
let result: null | number = null;
if (x > 0) {
  result = 1;
} else {
  result = 2;
}
```

Javascript' if/else doesn't have the necessary properties to be compared with a pure function. Again, it starts "changing something somewhere", and you never know what until you read the source code.

This implementation of conditional expression makes it unnecessarily harder to reason about the code.

Can we do better?

### Ternaries

The simplest solution to turn a "statement" if/else into an "expression" in Javascript is to convert it into a ternary expression:

```typescript
const result = n > 0 ? 1 : 2;
```

Ternaries are great but they have a few drawbacks: 

- first, it's hard to follow the code when even a little bit of nesting is involved:

```typescript
const result = n > 0 ? 1 : n < 0 ? -1 : 0;
```

- second, since the values in the expression aren't always already computed and thus require a multiline computation, ternaries become hard to read and/or require extra tricks to make them work:

```typescript
const getX = () => {
  // multiple lines of procuring x
  return x;
};
const getY = () => {
  // multiple lines of procuring y
  return y;
};
// move the computations into its own functions
const result1 = n > 0 ? getX() : getY();

// or use an IIFE
const result2 = n > 0 ? (() => {
  // multiple lines of procuring x
  return x;
})() : (() => {
  // multiple lines of procuring y
  return y;
})();
```

> A word about IIFE: it's an acronym for Immediately Invoked Function Expression. It's a function that is executed immediately after creation. It allows to produce a value from a multiline computation without defining a named function anywhere. You can inline it anywhere. Drawback is that it's a bit harder to read.

### Function wrapping

We also can just wrap the whole if/else in a function:

```typescript
function f(n: number): number {
  if (n > 0) {
    return 1;
  } else {
    return 2;
  }
}
```

This approach is pretty popular: you can (squinting hard enough) see this pattern in Redux and React's useReducer, amongst many other places.

```typescript
function reducer(state: State, action: Action): State {
  if (action.type === 'INCREMENT') {
    return { ...state, count: state.count + 1 };
  } else if (action.type === 'DECREMENT') {
    return { ...state, count: state.count - 1 };
  } else {
    return state;
  }
}
```

Or course, switch/case is almost always used instead of if/else:

```typescript
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'DECREMENT':
      return { ...state, count: state.count - 1 };
    default:
      return state;
  }
}
```

## Exhaustiveness checking

In the React reducer example above, I've used a `default` case to handle any action that isn't handled by the previous cases.

In practice though, you'll rarely want to do that. Having a default case strips you of a very important feature: exhaustiveness checking.

> So, as I promised, we circled back to the topic of exhaustiveness from the previous post.

Assume you have two actions: `INCREMENT` and `DECREMENT` and the reducer above.

Now, you add a third action: `RESET`. Now, remembering to add the `RESET` case to the reducer is completely up to you. The compiler won't remind you of that. In a large code base, with a lot of concurrent features and tasks to think about, it's really easy to forget things such as this.

Conversely, if your reducer was defined without a default case, such as following:

```typescript
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'DECREMENT':
      return { ...state, count: state.count - 1 };
  }
}
```

adding a `RESET` action type without catering to it in reducer would not compile. At the end of switch/case, there's still a possible `action.type` `RESET` that makes the function to be able to return `undefined`, which contradicts its return type (State).

TODO "now you couldve had absurd" => what if we remove state return type?

TODO really need to have a set? use a subtype!

TODO what to choose? whatever produces a value!

Functionally, switch/case is very often equivalent to if/else; more details in the first post.

Not only frontend but rather “as much as important on the backend” (event sourcing)
Javascript matching issues
Typescript matching issues (structural typing) (has to be a runtime value to match) (can do compile time but no match)
Object key matching technique (criticized for indirection)
Discriminated union
Two Fields
A Case for Expressions (notification example: save notification to db, log it, batch it, delay it, prioritize it) - can do same with a callback, but we’re at the door of callback hell now - what if they’re also async?
```
match transaction:
    case Purchase(item, price, quantity):
        total = price * quantity
        updateInventory(item, -quantity)
        recordSale(total)
    case Refund(order_id, amount):
        refundAmount(order_id, amount)
        updateCustomerBalance(order_id, amount)
    case Transfer(from_account, to_account, amount):
        debitAccount(from_account, amount)
        creditAccount(to_account, amount)
    case _:
        logUnknownTransaction(transaction)

```

ts-pattern
A case for exhaustiveness and why it’s not needed (most of the time)

TODO absurd name

TODO OOP auto exhaustiveness

TODO axis of change