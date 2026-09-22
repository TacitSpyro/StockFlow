from django.urls import path
from .views import login_admin

urlpatterns = [
    path('admin/login/', login_admin),
]