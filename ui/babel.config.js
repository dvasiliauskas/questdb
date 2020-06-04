const plugins = [
  "transform-class-properties",
  [
    "@babel/plugin-transform-runtime",
    {
      corejs: 3,
      regenerator: true,
      useESModules: true,
    },
  ],
]

module.exports = {
  env: {
    development: {
      plugins: [
        [
          "styled-components",
          {
            displayName: true,
            minify: false,
            pure: true,
            ssr: false,
          },
        ],
        "@babel/plugin-transform-react-jsx-source",
        ...plugins,
      ],
    },
    production: {
      plugins: [
        [
          "styled-components",
          {
            displayName: false,
            minify: false,
            pure: true,
            ssr: false,
          },
        ],
        ...plugins,
      ],
    },
    test: {
      presets: [
        [
          "@babel/env",
          {
            targets: {
              node: "current",
            },
          },
        ],
      ],
    },
  },
  plugins: [],
  presets: [
    [
      "@babel/env",
      {
        corejs: 3,
        modules: false,
        useBuiltIns: "entry",
      },
    ],
    "@babel/react",
    "@babel/typescript",
  ],
}
