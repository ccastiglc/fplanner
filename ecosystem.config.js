module.exports = {
  apps: [
    {
      name: "fredo-planner",
      script: "npm",
      args: "start -- -H 127.0.0.1",
      cwd: "/home/ideatr6/apps/planner",
      instances: 1,
      autorestart: true,
      env: { NODE_ENV: "production" },
    },
  ],
};
