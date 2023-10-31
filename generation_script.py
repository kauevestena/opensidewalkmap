from re import T
from turtle import fillcolor
import folium
from folium.plugins import Search
import pandas as pd
import geopandas as gpd
from functions import *
from insertions import *

m = folium.Map(
    # min_zoom=2,
    # crs="EPSG4326"
    # max_zoom=10,
    tiles=None,
    zoom_control=False,
    # min_lon=-175,
    # max_lon=175,
    control_scale=True,
    
)

folium.TileLayer(tiles='OpenStreetMap',opacity=0.7,min_zoom=2,max_zoom=10).add_to(m)

#folium.TileLayer(tiles='https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.{ext}',
#                 attr='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
#                 opacity=0.4,min_zoom=2,max_zoom=10).add_to(m)

# CSV Columns are:
#   city_name,center_long,center_lat,url

cities_df = pd.read_csv('data/cities_data.csv')


cities_gdf = gpd.GeoDataFrame(cities_df,geometry=gpd.points_from_xy(cities_df.center_long,cities_df.center_lat),crs='EPSG:4326')

weblinks = []

for entry in cities_df.itertuples():
    weblinks.append(a_href_str(entry.city_name,entry.url))

cities_gdf['Place:'] = weblinks

#800080 

places_layer = folium.GeoJson(
    data=cities_gdf,
    marker=folium.CircleMarker(
        radius=7,
        fill=True,
        color='#800080',
        fill_color='magenta',
        fill_opacity=1,
        ),
    popup=folium.GeoJsonPopup(
    fields=['Place:'],
    # style='color:red'
    ),
    highlight_function=simple_highlight,
)

m.add_child(places_layer)

# the search bar:
Search(places_layer,'city_name',position='topright',placeholder='search available locations',collapsed=True).add_to(m)

m.save('index.html')


# modifying the HTML:

for insertion_point in insertions_dict:
    replace_at_html('index.html',insertion_point,insertions_dict[insertion_point])
