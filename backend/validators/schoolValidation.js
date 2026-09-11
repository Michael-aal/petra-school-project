const { z } = require("zod");


const schoolSchema = z.object({

name:
z.string()
.min(3,"School name too short"),


email:
z.string()
.email()
.optional(),


phone:
z.string()
.optional(),


address:
z.string()
.optional(),


country:
z.string()
.optional(),


state:
z.string()
.optional(),


city:
z.string()
.optional(),


timezone:
z.string()
.optional()

});


module.exports = schoolSchema;