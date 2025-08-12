from rest_framework import serializers
from .models import UserTastePreference, Recipe

class RecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = '__all__'

class UserTastePreferenceSerializer(serializers.ModelSerializer):
    dietary_preferences = serializers.ListField(child=serializers.CharField(allow_blank=True), required=False, default=[])
    allergies = serializers.ListField(child=serializers.CharField(allow_blank=True), required=False, default=[])

    class Meta:
        model = UserTastePreference
        fields = ('dietary_preferences', 'allergies')

    def create(self, validated_data):
        validated_data['dietary_preferences'] = ','.join(validated_data.get('dietary_preferences', []))
        validated_data['allergies'] = ','.join(validated_data.get('allergies', []))
        return UserTastePreference.objects.create(user=self.context['request'].user, **validated_data)

    def update(self, instance, validated_data):
        if 'dietary_preferences' in validated_data:
            instance.dietary_preferences = ','.join(validated_data['dietary_preferences'])
        if 'allergies' in validated_data:
            instance.allergies = ','.join(validated_data['allergies'])
        instance.save()
        return instance

    def to_representation(self, instance):
        dp = (instance.dietary_preferences or '').split(',') if instance.dietary_preferences else []
        al = (instance.allergies or '').split(',') if instance.allergies else []
        return {
            'dietary_preferences': [s.strip() for s in dp if s.strip()],
            'allergies': [s.strip() for s in al if s.strip()],
        }

