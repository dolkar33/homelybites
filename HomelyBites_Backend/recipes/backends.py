from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class CustomUserModelBackend(ModelBackend):
    """
    Custom authentication backend for CustomUser model
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None
        
        try:
            # Check if username is an email
            if '@' in username:
                user = User.objects.get(email=username)
            else:
                user = User.objects.get(username=username)
        except User.DoesNotExist:
            return None
        
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        
        return None
    
    def user_can_authenticate(self, user):
        """
        Reject users with is_active=False. Custom user models may not have
        this attribute.
        """
        is_active = getattr(user, 'is_active', None)
        return is_active or is_active is None
