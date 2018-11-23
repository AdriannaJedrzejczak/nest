# GraphQL API

http://localhost:3000/graphql

# Query cat

```
{
  getCat(id: "1") {
    id
    name
    cool
    owners {
      name
      id
      cool
    }
  }
}
```

# Query cats

```
{
  getCats {
    id
    name
    cool
    owners {
      name
      id
      cool
    }
  }
}
```

# Mutate cat

```
mutation {
  createCat(
    createCatInput: {
      name:"Garfield"
      age: 42
      owners: ["Jon", "Odie"]
      cool: true
    }
  ) {
    id
    name
    age
    cool
    owners {
      name
      id
    }
  }
}
```

# Mutate to cool

```
mutation {
  setCool(id: "2")
}
```

# Subscribe to cat's creations

```
subscription {
  catChanged {
    name
    age
    cool
  }
}

subscription {
  personChanged {
    name
    cool
  }
}

subscription {
   coolChanged{
    ... on Cat {name cool}
    ... on Person {name cool}
  }
}
```
