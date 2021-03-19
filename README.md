# Demo

https://magic-hasura.vercel.app/login

# Quick start instructions

```txt
$ git clone https://github.com/magiclabs/example-hasura.git
$ cd example-hasura
$ mv .env.local.example .env.local
$ yarn install
$ yarn dev
```

# .env.local File

```txt
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=your-magic-publishable-key
MAGIC_SECRET_KEY=your-magic-secret-key
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
JWT_SECRET=your-32+-character-secret
NEXT_PUBLIC_HASURA_GRAPHQL_URL=your-graphql-api-server
```

- _Note one: if you just want authentication, and not the to-do list, delete the `/components/todo` folder and the reference to `<TodoList>` in `index.js`._

- _Note two: the tutorial was built using Magic UI components. If you swap them out for your own custom CSS, you can also delete the `_app.js` and `_document.js` files, and `@magiclabs/ui`, `framer-motion` and `rxjs` from your `package.json` dependencies._

# Tutorial

https://magic.link/posts/magic-hasura
