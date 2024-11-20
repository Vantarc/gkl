FROM nikolaik/python-nodejs:python3.10-nodejs19

RUN apt-get update

RUN apt-get install -y cups

RUN adduser gkl_user

WORKDIR /srv
RUN git clone https://github.com/Vantarc/gkl.git ./gkl
RUN chown -R gkl_user:gkl_user gkl

WORKDIR /srv/gkl
RUN pip install -r requirements.txt
RUN pip install gunicorn==19.0.0

USER gkl_user


WORKDIR /srv/gkl/static

RUN npm install 

# CMD tail -f /dev/null
CMD python /srv/gkl/wsgi.py
