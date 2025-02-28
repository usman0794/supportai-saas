"""
Alembic migration environment.

This file configures Alembic so it can:

1. Load our application settings from the .env file.
2. Connect to the Supabase PostgreSQL database.
3. Detect changes in our SQLAlchemy models.
4. Generate database migration files automatically.
5. Apply those migrations to the database.
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Import application configuration.
# This loads DATABASE_URL and other settings from .env.
from app.core.config import settings

# Import SQLAlchemy's Base class.
# Alembic uses Base.metadata to detect database tables.
from app.database.base import Base

# Import our models so Alembic knows about them.
# We will add more models here as the project grows.
from app.models.profile import Profile
from app.models.chatbot import Chatbot
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.conversation import Conversation
from app.models.message import Message


# ---------------------------------------------------------
# Alembic configuration
# ---------------------------------------------------------

# Get the Alembic configuration object.
config = context.config


# ---------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------

# Load logging settings from alembic.ini.
# This allows Alembic to display migration information
# in the terminal.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# ---------------------------------------------------------
# Database configuration
# ---------------------------------------------------------

# Get the PostgreSQL database URL from our .env file
# through the Pydantic Settings configuration.
#
# We do not hardcode the database URL in this file because
# it contains sensitive database credentials.
config.set_main_option(
    "sqlalchemy.url",
    settings.DATABASE_URL.replace("%", "%%"),
)


# ---------------------------------------------------------
# SQLAlchemy metadata
# ---------------------------------------------------------

# Tell Alembic which SQLAlchemy metadata to compare
# with the actual database.
#
# When we add or modify models, Alembic can detect
# those changes and generate migration files.
target_metadata = Base.metadata


# ---------------------------------------------------------
# Offline migrations
# ---------------------------------------------------------

def run_migrations_offline() -> None:
    """
    Run migrations in offline mode.

    Offline mode generates SQL statements without
    creating a live database connection.
    """

    # Get the database URL configured above.
    url = config.get_main_option("sqlalchemy.url")

    # Configure Alembic for offline migration generation.
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    # Start a migration transaction.
    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------
# Online migrations
# ---------------------------------------------------------

def run_migrations_online() -> None:
    """
    Run migrations in online mode.

    Online mode creates a real connection to our
    Supabase PostgreSQL database and applies migrations.
    """

    # Create the SQLAlchemy database engine using
    # the configuration from alembic.ini.
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    # Open a connection to PostgreSQL.
    with connectable.connect() as connection:

        # Configure Alembic using the active database
        # connection and our SQLAlchemy model metadata.
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        # Start a database transaction and run migrations.
        with context.begin_transaction():
            context.run_migrations()


# ---------------------------------------------------------
# Start migration process
# ---------------------------------------------------------

# Alembic can run in either offline or online mode.
#
# For our normal development workflow, online mode will
# connect directly to Supabase PostgreSQL.
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()