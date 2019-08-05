import os
from app import create_app
app = create_app()
app.run(host='0.0.0.0', port=5566, ssl_context='adhoc')
