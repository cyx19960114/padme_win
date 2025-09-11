from setuptools import setup, find_packages

with open("README.md", 'r') as f:
    long_description = f.read()

setup(
    name="MetadataProvider",
    version="1.0",
    description="The Metadata Provider for Stations in the PHT architecture.",
    license="TBA",
    long_description=long_description,
    author="Laurenz Neumann",
    author_email="Laurenz.Neumann@rwth-aachen.de",
    url="https://menzel.informatik.rwth-aachen.de:3005",
    packages=find_packages(),
    scripts=["bin/metadataprovider", "bin/metadatastore"],
    install_requires=["rdflib-sqlalchemy~=0.5","APScheduler==3.6.3","rdflib~=6.2","mongoengine==0.21.0","pyshacl~=0.18.0","observable==1.0.3","tornado==6.1","python-dateutil==2.8.1","pytest==6.2.4","mongomock==3.22.0","tzlocal==2.1","sqlalchemy~=1.4"],
    package_data={"metadataInfrastructure":["Schema", "tests/schema.ttl", "tests/trainShacl.ttl"]}
)