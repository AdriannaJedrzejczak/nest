# GraphQL API

http://localhost:3000/graphql

# Query cats

```
{
  getCats {
    id
    name
    owners {
      name
      id
    }
  }
}
```

# Mutate cat

```
mutation {
  createCat(
    createCatInput: {
      name: "Duvel"
      age: 1000
      owners: ["Cyril"]
    }
  ) {
    id
    name
    age
    owners {
      name
      id
    }
  }
}
```

# Subscribe to cat's creations

```
subscription {
  catCreated {
    name
    age
  }
}
```
