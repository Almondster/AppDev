import sys; from marketplace.models import User; print('--- ADMINS ---'); [print(f'email={u.email}, role={u.role}, uid={u.firebase_uid}') for u in User.objects.filter(role='admin')]
