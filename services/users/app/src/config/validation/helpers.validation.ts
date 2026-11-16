import { existsSync } from "fs"
import Joi from "joi"

export const fileExists = () => {
	return Joi.string().custom((value, helper) => {
		if (!existsSync)
			return helper.error('file.notFound', { path: value })
		return value;
	}).messages({
		'file.notFound': 'File not found at path: {{#path}}'
	})
}