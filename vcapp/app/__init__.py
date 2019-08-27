from flask import Flask


def create_app():
    app = Flask(__name__)
    app.config.from_object('config')
    from app.main import main as main_blueprint
    app.register_blueprint(main_blueprint)
    app.static_folder = app.config['STATIC_FOLDER']
    app.upload_folder = app.config['UPLOAD_FOLDER']
    return app
