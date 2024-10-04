(program) @scope
(block_statement) @scope
(profile_statement) @scope
(function_definition) @scope
(model) @scope

(function_declarator name: (identifier) @local.escape)

(parameter_declaration parameter: (identifier) @local)
(var_decl name: (identifier) @local)
(top_var_decl name: (identifier) @local)
(top_var_decl_no_assign name: (identifier) @local)

(for_statement loopvar: (identifier) @local) @scope

(identifier) @usage
