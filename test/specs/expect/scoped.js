//src: test/specs/fixtures/scoped.tag
riot.tag2('scoped-tag', '<p>should have a border</p>', 'scoped-tag,[data-is="scoped-tag"]{ background: red; } scoped-tag p,[data-is="scoped-tag"] p{ border: solid 1px black }', '', function(opts) {
});