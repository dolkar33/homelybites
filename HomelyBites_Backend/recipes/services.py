import requests
import os
from django.conf import settings
from .models import Recipe, Category, Cuisine
from slugify import slugify
import secrets
import string
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from .models import EmailVerification, EmailChangeRequest
from .models import PasswordResetRequest


class SpoonacularService:
    BASE_URL = "https://api.spoonacular.com"
    
    def import_cuisines_from_recipes(self, recipes):
        """
        Given a list of recipe dicts (from Spoonacular), extract and save unique cuisines.
        """
        from slugify import slugify
        cuisines_added = []
        for recipe in recipes:
            for cuisine_name in recipe.get('cuisines', []):
                slug = slugify(cuisine_name)
                cuisine, created = Cuisine.objects.get_or_create(
                    slug=slug,
                    defaults={'name': cuisine_name}
                )
                if created:
                    cuisines_added.append(cuisine.name)
        return cuisines_added
    
    def __init__(self):
        # Get API key from settings
        self.api_key = settings.SPOONACULAR_API_KEY
    
    def search_recipes(self, query=None, cuisine=None, diet=None, number=10, offset=0):
        """
        Search for recipes using the Spoonacular API
        """
        endpoint = f"{self.BASE_URL}/recipes/complexSearch"
        
        params = {
            "apiKey": self.api_key,
            "number": number,
            "offset": offset,
            "addRecipeInformation": True,
            "fillIngredients": True,
            "includeNutrition": True,
        }
        
        if query:
            params["query"] = query
        if cuisine:
            params["cuisine"] = cuisine
        if diet:
            params["diet"] = diet
            
        response = requests.get(endpoint, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            # Handle API errors
            return {"error": f"API Error: {response.status_code}", "message": response.text}
    
    def get_recipe_by_id(self, recipe_id):
        """
        Get detailed recipe information by ID
        """
        endpoint = f"{self.BASE_URL}/recipes/{recipe_id}/information"
        
        params = {
            "apiKey": self.api_key,
            "includeNutrition": True,
        }
        
        response = requests.get(endpoint, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            # Handle API errors
            return {"error": f"API Error: {response.status_code}", "message": response.text}
    
    def get_nutrition_widget(self, recipe_id):
        """
        Get nutrition widget data for a recipe by ID
        """
        endpoint = f"{self.BASE_URL}/recipes/{recipe_id}/nutritionWidget.json"
        params = {"apiKey": self.api_key}
        response = requests.get(endpoint, params=params)
        if response.status_code == 200:
            return response.json()
        else:
            return None  # or handle error as needed

    def import_recipe_to_db(self, recipe_data):

        recipe_id = recipe_data['id']
        # Check if recipe already exists
        if Recipe.objects.filter(spoonacular_id=recipe_id).exists():
            return Recipe.objects.get(spoonacular_id=recipe_id)

        # Fetch full recipe details
        details = self.get_recipe_by_id(recipe_id)
        if not details or 'error' in details:
            print(f"Error fetching details for recipe {recipe_id}: {details.get('message', 'Unknown error') if details else 'No details'}")
            return None

        # Fetch nutrition widget (for more user-friendly nutrition info)
        nutrition_widget = self.get_nutrition_widget(recipe_id)

        # DEBUG: Print details and nutrition_widget for troubleshooting
        import pprint
        print("=== Spoonacular Details ===")
        pprint.pprint(details)
        print("=== Nutrition Widget ===")
        pprint.pprint(nutrition_widget)

        # Create recipe instance
        recipe = Recipe(
            title=details['title'],
            slug=slugify(details['title']),
            spoonacular_id=recipe_id,
            image_url=details.get('image', ''),
            prep_time=details.get('preparationMinutes', details.get('readyInMinutes', 30)),
            cook_time=details.get('cookingMinutes', 30),
            difficulty='medium',  # You can adjust this logic
        )

        # Ingredients
        ingredients_list = []
        for ingredient in details.get('extendedIngredients', []):
            ingredients_list.append(
                f"{ingredient.get('amount', '')} {ingredient.get('unit', '')} {ingredient.get('name', '')}"
            )
        recipe.ingredients = "\n".join(ingredients_list)


        # Instructions (robust, multi-section, fallback)
        instructions_text = ''
        if 'analyzedInstructions' in details and details['analyzedInstructions']:
            instructions_sections = []
            for section in details['analyzedInstructions']:
                steps = section.get('steps', [])
                if steps:
                    instructions_sections.extend([step.get('step', '') for step in steps if step.get('step')])
            instructions_text = "\n".join(instructions_sections)
        if not instructions_text:
            instructions_text = details.get('instructions', '') or recipe_data.get('instructions', '')
        recipe.instructions = instructions_text

        # Nutrition (from details['nutrition'] if present, else from widget, fallback to recipe_data)
        nutrition_data = details.get('nutrition', {}).get('nutrients', [])
        if not nutrition_data:
            nutrition_data = recipe_data.get('nutrition', {}).get('nutrients', [])
        for nutrient in nutrition_data:
            if nutrient.get('name') == 'Calories':
                recipe.calories = f"{nutrient.get('amount', '')} {nutrient.get('unit', '')}"
            elif nutrient.get('name') == 'Fat':
                recipe.fat = f"{nutrient.get('amount', '')} {nutrient.get('unit', '')}"
            elif nutrient.get('name') == 'Sugar':
                recipe.sugar = f"{nutrient.get('amount', '')} {nutrient.get('unit', '')}"
            elif nutrient.get('name') == 'Protein':
                recipe.protein = f"{nutrient.get('amount', '')} {nutrient.get('unit', '')}"
            elif nutrient.get('name') == 'Carbohydrates':
                recipe.carbohydrates = f"{nutrient.get('amount', '')} {nutrient.get('unit', '')}"

        # If widget data is available, optionally overwrite for user-friendly values
        if nutrition_widget:
            recipe.calories = nutrition_widget.get('calories', recipe.calories)
            recipe.fat = nutrition_widget.get('fat', recipe.fat)
            recipe.sugar = nutrition_widget.get('sugar', recipe.sugar)
            recipe.protein = nutrition_widget.get('protein', recipe.protein)
            recipe.carbohydrates = nutrition_widget.get('carbs', recipe.carbohydrates)

        recipe.save()

        # Categories
        if 'dishTypes' in details:
            for dish_type in details['dishTypes']:
                category_slug = slugify(dish_type)
                category, created = Category.objects.get_or_create(
                    slug=category_slug,
                    defaults={'name': dish_type.title()}
                )
                recipe.categories.add(category)

        # Link cuisines to recipe
        if 'cuisines' in details:
            for cuisine_name in details['cuisines']:
                slug = slugify(cuisine_name)
                cuisine, _ = Cuisine.objects.get_or_create(
                    slug=slug,
                    defaults={'name': cuisine_name}
                )
                recipe.cuisines.add(cuisine)
        return recipe

    def import_random_recipes(self, number=10, tags=None):
        """
        Import random recipes from Spoonacular API
        """
        endpoint = f"{self.BASE_URL}/recipes/random"
        
        params = {
            "apiKey": self.api_key,
            "number": number,
            "includeNutrition": True,
        }
        
        if tags:
            params["tags"] = ",".join(tags)
            
        response = requests.get(endpoint, params=params)
        
        if response.status_code == 200:
            data = response.json()
            imported_recipes = []
            
            for recipe_data in data.get('recipes', []):
                recipe = self.import_recipe_to_db(recipe_data)
                imported_recipes.append(recipe)
                
            return imported_recipes
        else:
            # Handle API errors
            return {"error": f"API Error: {response.status_code}", "message": response.text}


class EmailVerificationService:
    """Service for handling email verification"""
    
    @staticmethod
    def generate_verification_token():
        """Generate a secure random verification token"""
        import secrets
        import string
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(64))
    
    @staticmethod
    def send_verification_email(user, token):
        """Send verification email to user with verification link"""
        from django.core.mail import send_mail
        from django.template.loader import render_to_string
        from django.utils.html import strip_tags
        from django.conf import settings
        
        print(f"Attempting to send verification email to {user.email}")
        
        subject = 'Verify Your Email - HomelyBites'
        
        # Create verification link
        verification_url = f"http://127.0.0.1:8000/api/verify-email/{token}/"
        print(f"Verification URL: {verification_url}")
        
        # HTML message
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #FC7D7D; margin: 0;">HomelyBites</h1>
                    <p style="color: #666; font-size: 18px;">Welcome to the family!</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
                    <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Verify Your Email Address</h2>
                    <p style="text-align: center; margin-bottom: 30px;">
                        Thank you for signing up! Please click the button below to verify your email address and complete your registration.
                    </p>
                    
                    <div style="text-align: center;">
                        <a href="{verification_url}" 
                           style="background: #FC7D7D; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    
                    <p style="text-align: center; margin-top: 20px; font-size: 14px; color: #666;">
                        Or copy and paste this link in your browser:<br>
                        <a href="{verification_url}" style="color: #FC7D7D; word-break: break-all;">{verification_url}</a>
                    </p>
                </div>
                
                <div style="text-align: center; color: #666; font-size: 14px;">
                    <p>This verification link will expire in 10 minutes.</p>
                    <p>If you didn't create an account, please ignore this email.</p>
                    <br>
                    <p>Best regards,<br>The HomelyBites Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text message
        plain_message = f"""
        Welcome to HomelyBites!
        
        Thank you for signing up! Please click the link below to verify your email address:
        
        {verification_url}
        
        This verification link will expire in 10 minutes.
        
        If you didn't create an account, please ignore this email.
        
        Best regards,
        The HomelyBites Team
        """
        
        try:
            print(f"Email settings: HOST={settings.EMAIL_HOST}, PORT={settings.EMAIL_PORT}, USER={settings.EMAIL_HOST_USER}")
            print(f"Sending email from {settings.DEFAULT_FROM_EMAIL} to {user.email}")
            
            send_mail(
                subject=subject,
                message=plain_message,
                html_message=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            print(f"Email sent successfully to {user.email}")
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            print(f"Email settings: HOST={settings.EMAIL_HOST}, PORT={settings.EMAIL_PORT}, USER={settings.EMAIL_HOST_USER}")
            return False
    
    @staticmethod
    def create_verification_token(user):
        """Create a new verification token for a user"""
        from django.utils import timezone
        from datetime import timedelta
        from .models import EmailVerification
        
        print(f"Creating verification token for user {user.email}")
        
        # Delete any existing unused tokens for this user
        EmailVerification.objects.filter(user=user, is_used=False).delete()
        
        # Generate new token
        token = EmailVerificationService.generate_verification_token()
        expires_at = timezone.now() + timedelta(minutes=10)
        
        print(f"Generated token: {token[:10]}... expires at: {expires_at}")
        
        # Create verification record
        try:
            verification = EmailVerification.objects.create(
                user=user,
                token=token,
                expires_at=expires_at
            )
            print(f"Verification record created successfully: {verification.id}")
            return verification
        except Exception as e:
            print(f"Error creating verification record: {e}")
            raise e
    
    @staticmethod
    def verify_token(token):
        """Verify a user's email verification token"""
        from .models import EmailVerification
        from django.db import transaction, connection
        
        print(f"=== VERIFICATION SERVICE DEBUG START ===")
        print(f"Verifying token: {token[:10]}...")
        
        try:
            with transaction.atomic():
                verification = EmailVerification.objects.select_for_update().get(
                    token=token,
                    is_used=False
                )
                
                print(f"Found verification record for user: {verification.user.username}")
                print(f"User status before verification - is_active: {verification.user.is_active}, is_email_verified: {verification.user.is_email_verified}")
                
                if verification.is_expired():
                    print(f"Token expired at: {verification.expires_at}")
                    return False, "Verification link has expired"
                
                # Mark as used
                verification.is_used = True
                verification.save()
                print(f"Verification record marked as used")
                
                # Mark user as verified and active
                user = verification.user
                print(f"User object retrieved: {user.username}")
                print(f"User status before changes - is_active: {user.is_active}, is_email_verified: {user.is_email_verified}")
                
                user.is_email_verified = True
                user.is_active = True
                user.save()
                
                print(f"User saved with new status - is_active: {user.is_active}, is_email_verified: {user.is_email_verified}")
                
                # Force database commit
                connection.commit()
                
                # Refresh from database to ensure changes are saved
                user.refresh_from_db()
                
                print(f"DEBUG: User {user.username} verified and activated in service")
                print(f"DEBUG: Final user status - is_active: {user.is_active}, is_email_verified: {user.is_email_verified}")
                
                # Double-check by querying the database again
                from django.contrib.auth import get_user_model
                User = get_user_model()
                fresh_user = User.objects.get(id=user.id)
                print(f"Fresh user from DB - is_active: {fresh_user.is_active}, is_email_verified: {fresh_user.is_email_verified}")
                
                # If still not updated, force update with raw SQL
                if not fresh_user.is_active or not fresh_user.is_email_verified:
                    print("WARNING: User not updated properly, forcing with raw SQL")
                    with connection.cursor() as cursor:
                        cursor.execute("""
                            UPDATE recipes_customuser 
                            SET is_active = 1, is_email_verified = 1 
                            WHERE id = %s
                        """, [user.id])
                        connection.commit()
                    
                    # Refresh again
                    fresh_user.refresh_from_db()
                    print(f"After raw SQL update - is_active: {fresh_user.is_active}, is_email_verified: {fresh_user.is_email_verified}")
                
                print(f"=== VERIFICATION SERVICE DEBUG END ===")
                
                return True, "Email verified successfully", fresh_user
                
        except EmailVerification.DoesNotExist:
            print(f"Verification record not found for token: {token[:10]}...")
            print(f"=== VERIFICATION SERVICE DEBUG END ===")
            return False, "Invalid verification link", None

    @staticmethod
    def generate_verification_token():
        """Generate a secure random token for email verification."""
        return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(50))
    
    @staticmethod
    def create_verification_token(user):
        """Create a new email verification token for a user."""
        # Delete any existing unused tokens for this user
        EmailVerification.objects.filter(user=user, is_used=False).delete()
        
        token = EmailVerificationService.generate_verification_token()
        expires_at = timezone.now() + timedelta(hours=24)
        
        verification = EmailVerification.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )
        
        return verification
    
    @staticmethod
    def send_verification_email(user, token):
        """Send verification email to user."""
        subject = 'Welcome to HomelyBites! Please verify your email'
        message = f"""
Hello {user.first_name}!

Welcome to HomelyBites! To complete your registration and start exploring delicious recipes, please click the link below to verify your email address:

{settings.BACKEND_BASE_URL}/api/verify-email/{token}/

After clicking the link, you'll be able to log in to your account and start your culinary journey!

If you didn't create an account with HomelyBites, please ignore this email.

Best regards,
The HomelyBites Team
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            return True
        except Exception as e:
            print(f"Failed to send verification email: {e}")
            return False
    
    @staticmethod
    def verify_token(token):
        """Verify an email verification token."""
        try:
            verification = EmailVerification.objects.get(token=token, is_used=False)
            
            if verification.is_expired():
                return False, "Verification link has expired. Please request a new one.", None
            
            # Mark token as used
            verification.is_used = True
            verification.save()
            
            return True, "Email verified successfully!", verification.user
            
        except EmailVerification.DoesNotExist:
            return False, "Invalid verification link.", None
    
    @staticmethod
    def create_email_change_request(user, new_email):
        """Create a new email change request."""
        # Delete any existing unused requests for this user
        EmailChangeRequest.objects.filter(user=user, is_used=False).delete()
        
        token = EmailVerificationService.generate_verification_token()
        expires_at = timezone.now() + timedelta(hours=24)
        
        change_request = EmailChangeRequest.objects.create(
            user=user,
            old_email=user.email,
            new_email=new_email,
            token=token,
            expires_at=expires_at
        )
        
        return change_request
    
    @staticmethod
    def send_email_change_verification(user, change_request):
        """Send email change verification to the old email address."""
        subject = 'Email Change Request - HomelyBites'
        message = f"""
Hello {user.first_name}!

You have requested to change your email address from {user.email} to {change_request.new_email}.

To confirm this change, please click the link below:

{settings.BACKEND_BASE_URL}/api/confirm-email-change/{change_request.token}/

This link will expire in 24 hours.

If you did not request this change, please ignore this email and your current email address will remain unchanged.

Best regards,
The HomelyBites Team
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],  # Send to old email
                fail_silently=False,
            )
            return True
        except Exception as e:
            print(f"Failed to send email change verification: {e}")
            return False
    
    @staticmethod
    def verify_email_change_token(token):
        """Verify an email change token and update the user's email."""
        try:
            change_request = EmailChangeRequest.objects.get(token=token, is_used=False)
            
            if change_request.is_expired():
                return False, "Email change link has expired. Please request a new one.", None
            
            # Mark token as used
            change_request.is_used = True
            change_request.save()
            
            # Update user's email
            user = change_request.user
            user.email = change_request.new_email
            user.save()
            
            return True, "Email changed successfully!", user
            
        except EmailChangeRequest.DoesNotExist:
            return False, "Invalid email change link.", None

    @staticmethod
    def create_password_reset_request(user):
        """Create a new password reset request for a user."""
        # Delete any existing unused requests for this user
        PasswordResetRequest.objects.filter(user=user, is_used=False).delete()
        
        # Generate unique token
        token = secrets.token_urlsafe(32)
        
        # Set expiration to 10 minutes from now
        expires_at = timezone.now() + timedelta(minutes=10)
        
        # Create the reset request
        reset_request = PasswordResetRequest.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )
        
        return reset_request
    
    @staticmethod
    def send_password_reset_email(user, reset_request):
        """Send password reset email to user."""
        try:
            subject = "Password Reset Request - HomelyBites"
            
            # Create the reset link - this should go to the frontend reset password page
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            reset_url = f"{frontend_url}/reset-password/{reset_request.token}"
            
            message = f"""
Hello {user.username},

You have requested to reset your password for your HomelyBites account.

To reset your password, please click the link below:
{reset_url}

This link will expire in 10 minutes for security reasons.

If you did not request this password reset, please ignore this email.

Best regards,
The HomelyBites Team
            """.strip()
            
            # Send email
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            return True
            
        except Exception as e:
            print(f"Error sending password reset email: {e}")
            return False
    
    @staticmethod
    def verify_password_reset_token(token, new_password=None):
        """Verify password reset token and optionally reset password."""
        print(f"=== DEBUG: verify_password_reset_token ===")
        print(f"Token received: {token}")
        print(f"New password provided: {new_password is not None}")
        
        try:
            # Find the reset request
            print(f"Looking for PasswordResetRequest with token: {token}")
            reset_request = PasswordResetRequest.objects.get(token=token)
            print(f"✅ Found reset request for user: {reset_request.user.username}")
            
            # Check if already used
            if reset_request.is_used:
                print(f"❌ Token already used")
                return False, "This password reset link has already been used", None
            
            # Check if expired
            if reset_request.is_expired():
                print(f"❌ Token expired at: {reset_request.expires_at}")
                return False, "This password reset link has expired", None
            
            print(f"✅ Token is valid and not expired")
            
            # Get the user
            user = reset_request.user
            
            # If new_password is provided, reset the password
            if new_password:
                print(f"Setting new password for user: {user.username}")
                # Validate password
                if len(new_password) < 8:
                    return False, "Password must be at least 8 characters long", None
                
                # Set new password
                user.set_password(new_password)
                user.save()
                print(f"✅ Password updated successfully")
                
                # Mark reset request as used
                reset_request.is_used = True
                reset_request.save()
                print(f"✅ Reset request marked as used")
                
                return True, "Password reset successfully!", user
            
            # Just verify token (no password reset)
            print(f"✅ Token verification successful")
            return True, "Token is valid", user
            
        except PasswordResetRequest.DoesNotExist:
            print(f"❌ PasswordResetRequest not found with token: {token}")
            print(f"Available tokens in database:")
            try:
                all_requests = PasswordResetRequest.objects.all()
                for req in all_requests:
                    print(f"  - Token: {req.token[:20]}... | User: {req.user.username} | Used: {req.is_used} | Expires: {req.expires_at}")
            except Exception as e:
                print(f"Error listing requests: {e}")
            return False, "Invalid password reset link", None
        except Exception as e:
            print(f"❌ Error verifying password reset token: {e}")
            return False, "An error occurred while verifying the token", None
