#MongoDB mongokit database model
#mongokit provides mapping for mongodb that is similar is form to using sqlalchemy for sqlite or postgres

from mongokit import Document

def max_length(length):
    def validate(value):
        if len(value) <= length:
            return True
        raise Exception('%s must be at most %s characters long' % length)
    return validate

class User(Document):
    __collection__ = 'users'
    __database__ = 'heroku_rvqmr5l8'

    structure = {
        'name': unicode,
        'email': unicode,
    }
    validators = {
        'name': max_length(50),
        'email': max_length(120)
    }
    use_dot_notation = True

    def update_from_json(self, json_data):
        for key in self:
            if key in json_data:
                self[key] = json_data[key]
                self.validate()

    def __repr__(self):
        return '<User %r>' % (self.name)

class Customer(Document):
    __collection__ = 'customers'
    __database__ = 'heroku_rvqmr5l8'
    structure = {
        'name': unicode,
        'email': unicode,
        'version': unicode,
        'prevDownload':unicode,
        'update': unicode,
    }
    validators = {
        'name': max_length(50),
        'email': max_length(120),
        'version': max_length(50),
        'prevDownload': max_length(50),
        'update': max_length(50),
    }

    use_dot_notation = True

    def update_from_json(self, json_data):
        for key in self:
            if key in json_data:
                self[key] = json_data[key]
                self.validate()

    def __repr__(self):
        return '<Customer %r>' % (self.name)