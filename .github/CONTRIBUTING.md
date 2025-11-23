# Contributing

## Opening an Issue

> [!IMPORTANT]
> So that we can best help you, it's important that you fill in all the fields in the issue template when raising a ticket.

This includes:
- A clear description of the issue and the steps to reproduce, along with actual and expected results
- Logs - [here's how to find them](https://domain-locker.com/about/developing/checking-logs)
- Debug info, which you can get by visiting the [`/advanced/debug-info`](https://domain-locker.com/advanced/debug-info) page
- Anything extra you think might be relevant (like screenshots, links, etc) is always appreciated too!

Before opening a ticket, please check:
- That you're running a recent/supported version of Domain Locker
- That there's not already a similar issue open
- That you've checked the docs, and not found the solution there
- And that the issue is actually a bug with Domain Locker, and not with a third-party service or your own setup

You can also take a look at our [Debugging Starter](https://domain-locker.com/about/developing/debugging), which will point you in the right direction for common problems.

---

## Developing
For setup instructions, check the [Developing Guide](https://domain-locker.com/about/developing) in the docs.

I've tried to make it as easy as possible to get started, but if you have any questions, please don't hesitate to ask!

#### TL;DR
```bash
git clone git@github.com:Lissy93/domain-locker.git
cd domain-locker
npm install
cp .env.example .env
npm run dev
```

We love contributions from the community, so if you build something awesome, please do send us a pull request! (and we'll also give you a shout-out on our [Attributions page](https://domain-locker.com/about/attributions))

> [!TIP]
> **No need to setup a database!** I've provisioned you a public Supabase instance- to connect to it just use the env vars in the [`.env.sample`](https://github.com/Lissy93/domain-locker/blob/0f78fd869f198531b5b0ee3b084b9be6440ac9db/.env.sample#L5-L14)


---

## Common Issues

There's a few common issues that are commonly raised as tickets, please don't raise new tickets!
- Domain info fetching issues - see [Domain fetching config](https://domain-locker.com/about/self-hosting/domain-fetching-config)

