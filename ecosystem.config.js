module.exports = {
  apps: [{
    name: "planner",
    script: "npm",
    args: "start -- -p 3003",
    cwd: "/home/ideatr6/apps/planner",
    instances: 1,
    autorestart: true,
    env: { NODE_ENV: "production" }
  }]
}
