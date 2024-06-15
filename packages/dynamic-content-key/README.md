# Dynamic Content Key

## Use case

In many cases, fields have a fixed content key, meaning they always display the same label. For example, a field labeled "Full name" will consistently display as "Full name". However, depending on previous questions asked in a sequence, the perspective may change. If you previously indicated that you are submitting an application on behalf of someone else (for instance, using power of attorney), the field label might adjust to "The principal's full name".

## Usage

## As a static content key

```
  {
    field: {
      contentKey: 'foo'
    }
  }
```

## As a functional content key

```
  {
    field: {
      contentKey: (req, res) => req.foo
    }
  }
```

## As conditionals

```
  {
    field: {
      contentKey: [
        {
          field: 'foo',
          value: 'bar',
          key: 'baz',
        },
        {
          field: 'foo',
          op: '!='
          value: 'baz',
          key: 'bar',
        },
        'fallback'
      ]
    }
  }
```
