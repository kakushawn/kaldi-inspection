import time
import logging


class Log:
    def __init__(self, name):
        self._path = 'log/%s.txt' % time.strftime('%Y%m%d', time.localtime())
        logging.basicConfig(
            level=logging.DEBUG,
            filename=self.path,
            format='%(asctime)s - %(name)s [%(filename)s:%(lineno)d] - %(levelname)s - %(message)s'
        )
        self._logger = logging.getLogger(name)

    @property
    def path(self):
        return self._path

    def info(self, message):
        self._logger.info(message)

    def debug(self, message):
        self._logger.debug(message)

    def warning(self, message):
        self._logger.warning(message)

    def error(self, message):
        self._logger.info(message)
