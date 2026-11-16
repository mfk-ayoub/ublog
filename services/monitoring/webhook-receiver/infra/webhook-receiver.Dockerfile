FROM python:3.13-alpine

WORKDIR /app
COPY app.py .

EXPOSE 5001

CMD ["python", "-u", "app.py"]
