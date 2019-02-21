import {BINDING_TYPES, EXPRESSION_TYPES, GET_COMPONENT_FN, TEMPLATE_FN} from './constants'
import {builders, types} from '../../utils/build-types'
import {callTemplateFunction, createRootNode} from './utils'
import {TAG_TEMPLATE_PROPERTY} from '../constants'
import build from './builder'

/**
 * Extend the AST adding the new template property containing our template call to render the component
 * @param   { Object } ast - current output ast
* @param   { stiring } sourceFile - source file path
 * @param   { string } sourceCode - original source
 * @param   { Object } sourceNode - node generated by the riot compiler
 * @returns { Object } the output ast having the "template" key
 */
function extendTemplateProperty(ast, sourceFile, sourceCode, sourceNode) {
  types.visit(ast, {
    visitProperty(path) {
      if (path.value.key.value === TAG_TEMPLATE_PROPERTY) {
        path.value.value = builders.functionExpression(
          null,
          [
            TEMPLATE_FN,
            EXPRESSION_TYPES,
            BINDING_TYPES,
            GET_COMPONENT_FN
          ].map(builders.identifier),
          builders.blockStatement([
            builders.returnStatement(
              callTemplateFunction(
                ...build(
                  createRootNode(sourceNode),
                  sourceFile,
                  sourceCode
                )
              )
            )
          ])
        )

        return false
      }

      this.traverse(path)
    }
  })

  return ast
}

/**
 * Generate the component template logic
 * @param   { Object } sourceNode - node generated by the riot compiler
 * @param   { string } source - original component source code
 * @param   { Object } meta - compilation meta information
 * @param   { AST } ast - current AST output
 * @returns { AST } the AST generated
 */
export default function template(sourceNode, source, meta, ast) {
  const { options } = meta
  return  extendTemplateProperty(ast, options.file, source, sourceNode)
}