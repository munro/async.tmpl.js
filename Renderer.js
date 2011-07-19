var events = require('events');

function Renderer(params) {
    this.template = params.template;
    this.context = params.context;
    this.block = 0;
}

Renderer.prototype = Object.create(events.EventEmitter.prototype);

Renderer.prototype.exec = function (callback) {
    var that = this, data = '';

    // Hook convience parameter up to event emitter
    callback && this.once('done', callback);

    function defer() {
        var block;
        for (; that.block < that.template._blocks.length; that.block += 1) {
            block = that.template._blocks[that.block];
            if (block.type === 'text') {
                data += block.text;
            } else {
                return block.render(that, function (err, output) {
                    if (err) {
                        return that.emit('done', err);
                    }
                    data += output;
                    that.block += 1;
                    defer();
                });
            }
        }
        that.emit('done', false, data);
    };

    // Start rendering unless we're waiting on the template to tokenize
    if (this.template._tokenized) {
        defer();
    } else {
        this.template.once('compiled', function (err) {
            if (err) {
                that.emit('done', 'Could not render because template failed to tokenize: ' + err);
            } else {
                defer();
            }
        });
    }
};

module.exports = Renderer;

// vim: sw=4 ts=4 sts=4 et:
