# genexpr-language-server

This is a very embryonic implementation of a language server for Cycling 74's
GenExpr language.

I wanted a way to write genexpr code with more features than the default editor
in Max/MSP so I started making this.
It is also a good way to learn more about LSPs and programming in Typescript !

For now there is just a working connection and a bit of semantic typing.

## Installation 

To install and run this you need:

- A recent version of Node.js.
- npm (node package manager)
- A compatible editor (although I only tested this with Neovim)

You also need tree-sitter-genexpr to get syntax highlightings.
the server also relies on this to help with syntax structure.

You can find it here: 
https://github.com/sadguitarius/tree-sitter-genexpr

There is also my fork with some modificated highlightings: 
https://github.com/bsssssss/tree-sitter-genexpr

When you're all set clone the repository

```bash
git clone https://github.com/bsssssss/genexpr-language-server
cd genexpr-language-server
```

Install the dependencies 

```bash
npm install
```

Point the parser to your tree-sitter-genexpr directory in src/genexpr/parser.ts

```typescript
const genexprPath = path.resolve("/path/to/tree-sitter-genexpr");
```

Compile the server

```bash
npm run compile
```

## Setup Neovim

If you haven't done it already with tree-sitter-genexpr, create a genexpr.lua
file in your after/ftdetect directory :

```lua
vim.filetype.add({
	extension = {
		genexpr = "genexpr",
		gendsp = "genexpr",
	},
})
```

Create an autocommand to start the server on filetype detections.
Change the 'cmd' path to your installation

```lua
vim.api.nvim_create_autocmd("FileType", {
	pattern = "genexpr",
	callback = function()
		vim.lsp.start({
			name = "genexpr_ls",
			cmd = { "node", vim.fn.expand("path/to/genexpr-language-server/out/server/server.js"), "--stdio" },
			handlers = {
				["window/showMessage"] = function(_, result, ctx)
					vim.notify(result.message, vim.log.levels.INFO, { title = "GenExpr LSP" })
				end,
				["window/logMessage"] = function(_, result, ctx)
					vim.notify(result.message, vim.log.levels.DEBUG, { title = "GenExpr LSP Log" })
				end,
			},
		})
	end,
})
```

You should now see a greeting message when opening a .genexpr/.gendsp file !
