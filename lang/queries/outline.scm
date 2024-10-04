(functions "functions" @module.name)  @module
(data "data" @module.name)  @module
(transformed_data "transformed data" @module.name)  @module
(parameters "parameters" @module.name)  @module
(transformed_parameters "transformed parameters" @module.name)  @module
(model "model" @module.name)  @module
(generated_quantities "generated quantities" @module.name)  @module


(function_declarator
name: (identifier) @function.name
) @function

(top_var_decl name: (identifier) @variable.name) @variable
(top_var_decl_no_assign name: (identifier) @variable.name) @variable
