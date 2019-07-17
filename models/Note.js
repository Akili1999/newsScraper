var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var NoteSchema = new Schema ({
    noteBody: {
        type: String,
    },
    noteArticle: {
        type: Schema.Types.ObjectId,
        ref: "Article"
    }
});

var Note = mongoose.model("Note", NoteSchema);

module.exports = Note;
