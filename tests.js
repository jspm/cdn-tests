[
  ["@babel/core", function (babel) {
    console.log(babel);
    babel.transform('export var p = 5;', { sourceType: 'module' });
  }],
  "@babel/plugin-proposal-class-properties",
  "babylonjs",
  "react react-dom",
  "lit-html",
  "material-ui/styles/MuiThemeProvider material-ui/AppBar material-ui/DatePicker",
  // "@tensorflow/tfjs", pending jspm.dev fix
  "vue"
]
