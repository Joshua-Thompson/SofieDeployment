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
    structure = {
        'name': unicode,
        'email': unicode,
    }
    validators = {
        'name': max_length(50),
        'email': max_length(120)
    }
    use_dot_notation = True
    def __repr__(self):
        return '<User %r>' % (self.name)

class Customer(Document):
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
    def __repr__(self):
        return '<Customer %r>' % (self.name)