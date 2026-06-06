import json
from channels.generic.websocket import AsyncWebsocketConsumer


class EventConsumer(AsyncWebsocketConsumer):
    """
    Real-time eventlarni frontendga yuboruvchi WebSocket consumer.
    Frontend: ws://localhost:8000/ws/events/
    """

    async def connect(self):
        await self.channel_layer.group_add('events_live', self.channel_name)
        await self.accept()
        await self.send(json.dumps({'type': 'connected', 'message': 'ISUP real-time ulandi'}))

    async def disconnect(self, code):
        await self.channel_layer.group_discard('events_live', self.channel_name)

    async def event_new(self, message):
        """ISUP serverdan kelgan eventni frontendga yuboradi."""
        await self.send(json.dumps({
            'type': 'event.new',
            'data': message['data']
        }))
